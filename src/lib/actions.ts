"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { ISSUE_CATEGORY, ISSUE_PRIORITY, ISSUE_RAISED_BY, ISSUE_STATUS, PROPERTY_TYPES, ENTITY_TYPES } from "./enums";
import { getRole, can, type Capability } from "./rbac";
import { parseCsvLine } from "./csv";
import { parseBankCsv, matchTransactions, type MatchProposal, type OpenChargeLite } from "./reconcile";
import { deriveChargeState } from "./payments";

/** Throw if the active role lacks the capability (server-side enforcement). */
function assertCan(capability: Capability) {
  if (!can(capability, getRole())) {
    throw new Error(`Not permitted: ${capability}`);
  }
}

function pick<T extends readonly string[]>(allowed: T, value: unknown, fallback: T[number]): T[number] {
  return (allowed as readonly string[]).includes(String(value)) ? (value as T[number]) : fallback;
}

/** Create a maintenance/issue ticket on a property. */
export async function createIssue(formData: FormData) {
  assertCan("editIssues");
  const propertyId = String(formData.get("propertyId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!propertyId || !title) return;

  await prisma.issue.create({
    data: {
      propertyId,
      title,
      description: String(formData.get("description") ?? "").trim() || null,
      raisedBy: pick(ISSUE_RAISED_BY, formData.get("raisedBy"), "MANAGER"),
      category: pick(ISSUE_CATEGORY, formData.get("category"), "MAINTENANCE"),
      priority: pick(ISSUE_PRIORITY, formData.get("priority"), "MEDIUM"),
      status: "OPEN",
      cost: formData.get("cost") ? Number(formData.get("cost")) : null,
    },
  });
  revalidatePath("/issues");
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/");
}

/** Advance or set an issue's status. */
export async function updateIssueStatus(formData: FormData) {
  assertCan("editIssues");
  const id = String(formData.get("id") ?? "");
  const status = pick(ISSUE_STATUS, formData.get("status"), "OPEN");
  if (!id) return;
  await prisma.issue.update({
    where: { id },
    data: { status, resolvedAt: status === "RESOLVED" ? new Date() : null },
  });
  revalidatePath("/issues");
  revalidatePath("/");
}

/** Record a payment against a rent charge (clears / reduces arrears). */
export async function recordPayment(formData: FormData) {
  assertCan("recordPayments");
  const rentChargeId = String(formData.get("rentChargeId") ?? "");
  if (!rentChargeId) return;
  const charge = await prisma.rentCharge.findUnique({
    where: { id: rentChargeId },
    include: { payments: true },
  });
  if (!charge) return;
  const paid = charge.payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, charge.amount - paid);
  const requested = formData.get("amount") ? Number(formData.get("amount")) : outstanding;
  const amount = Math.min(requested, outstanding) || outstanding;

  await prisma.payment.create({
    data: { rentChargeId, amount, receivedAt: new Date(), method: "MANUAL", reference: "Handmatig geregistreerd" },
  });
  revalidatePath("/arrears");
  revalidatePath("/");
}

// --- CSV bulk import of properties ---

export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

/**
 * Import properties from CSV text. Expected columns (header row required):
 * Name, Street, PostalCode, City, Type, Owner, OwnerType, WOZValue, PurchasePrice, MonthlyCost
 * Unknown owners are created as LegalEntities; unknown types default to OFFICE.
 */
export async function importProperties(csv: string): Promise<ImportResult> {
  assertCan("importData");
  const result: ImportResult = { created: 0, skipped: 0, errors: [] };
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    result.errors.push("CSV needs a header row and at least one data row.");
    return result;
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = (name: string) => header.indexOf(name.toLowerCase());
  const col = { name: idx("name"), street: idx("street"), postal: idx("postalcode"), city: idx("city"), type: idx("type"), owner: idx("owner"), ownerType: idx("ownertype"), woz: idx("wozvalue"), purchase: idx("purchaseprice"), cost: idx("monthlycost") };
  if (col.name < 0 || col.city < 0) {
    result.errors.push("CSV must include at least 'Name' and 'City' columns.");
    return result;
  }

  const entityCache = new Map<string, string>();
  const existing = await prisma.legalEntity.findMany();
  for (const e of existing) entityCache.set(e.name.toLowerCase(), e.id);

  for (let r = 1; r < lines.length; r++) {
    const cells = parseCsvLine(lines[r]);
    const name = cells[col.name] ?? "";
    const city = cells[col.city] ?? "";
    if (!name || !city) {
      result.skipped++;
      result.errors.push(`Row ${r + 1}: missing name or city`);
      continue;
    }
    try {
      const ownerName = (col.owner >= 0 && cells[col.owner]) || "Eigenaar (privé)";
      let ownerId = entityCache.get(ownerName.toLowerCase());
      if (!ownerId) {
        const ownerType = (col.ownerType >= 0 && cells[col.ownerType]) || "BV";
        const created = await prisma.legalEntity.create({
          data: {
            name: ownerName,
            type: (ENTITY_TYPES as readonly string[]).includes(ownerType) ? ownerType : "BV",
            taxRegime: ownerType === "PERSONAL" ? "BOX3" : "VPB",
          },
        });
        ownerId = created.id;
        entityCache.set(ownerName.toLowerCase(), ownerId);
      }
      const type = (col.type >= 0 && cells[col.type]) || "OFFICE";
      const num = (v: string | undefined) => (v && !Number.isNaN(Number(v)) ? Number(v) : null);
      await prisma.property.create({
        data: {
          name,
          street: (col.street >= 0 && cells[col.street]) || "",
          postalCode: (col.postal >= 0 && cells[col.postal]) || "",
          city,
          type: (PROPERTY_TYPES as readonly string[]).includes(type) ? type : "OFFICE",
          ownerEntityId: ownerId,
          wozValue: num(cells[col.woz]),
          purchasePrice: num(cells[col.purchase]),
          monthlyCost: num(cells[col.cost]) ?? 0,
        },
      });
      result.created++;
    } catch (e) {
      result.skipped++;
      result.errors.push(`Row ${r + 1}: ${(e as Error).message}`);
    }
  }

  revalidatePath("/properties");
  revalidatePath("/");
  return result;
}

// --- Bank reconciliation ---

/**
 * Parse a pasted bank CSV export and propose matches against all open rent
 * charges. Read-only preview — nothing is written until applyReconciliation.
 */
export async function previewReconciliation(csv: string): Promise<{ proposals: MatchProposal[]; errors: string[] }> {
  assertCan("recordPayments");
  const { txs, errors } = parseBankCsv(csv);
  if (txs.length === 0) return { proposals: [], errors };

  const today = new Date();
  const charges = await prisma.rentCharge.findMany({
    include: {
      payments: true,
      lease: { include: { tenant: true, unit: { include: { property: true } } } },
    },
  });
  const open: OpenChargeLite[] = [];
  for (const c of charges) {
    const st = deriveChargeState(c, today);
    if (st.outstanding > 0.01) {
      open.push({
        id: c.id,
        tenant: c.lease.tenant.name,
        property: c.lease.unit.property.name,
        periodYm: c.periodYm,
        amount: c.amount,
        outstanding: st.outstanding,
      });
    }
  }
  return { proposals: matchTransactions(txs, open), errors };
}

/** Apply accepted matches: create a Payment per (chargeId, amount). */
export async function applyReconciliation(
  matches: { chargeId: string; amount: number; reference: string }[],
): Promise<{ applied: number }> {
  assertCan("recordPayments");
  let applied = 0;
  for (const m of matches) {
    if (!m.chargeId || !(m.amount > 0)) continue;
    const charge = await prisma.rentCharge.findUnique({ where: { id: m.chargeId }, include: { payments: true } });
    if (!charge) continue;
    const paid = charge.payments.reduce((s, p) => s + p.amount, 0);
    const outstanding = Math.max(0, charge.amount - paid);
    if (outstanding <= 0.01) continue; // already settled meanwhile
    await prisma.payment.create({
      data: {
        rentChargeId: m.chargeId,
        amount: Math.min(m.amount, outstanding),
        receivedAt: new Date(),
        method: "BANK",
        reference: m.reference?.slice(0, 140) || "Bankimport",
      },
    });
    applied++;
  }
  revalidatePath("/arrears");
  revalidatePath("/");
  return { applied };
}
