"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { ISSUE_CATEGORY, ISSUE_PRIORITY, ISSUE_RAISED_BY, ISSUE_STATUS, PROPERTY_TYPES, ENTITY_TYPES } from "./enums";
import { getRole, can, type Capability } from "./rbac";

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

/** Minimal RFC-4180-ish CSV row parser (handles quotes and escaped quotes). */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

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
