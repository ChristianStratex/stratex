"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { ISSUE_CATEGORY, ISSUE_PRIORITY, ISSUE_RAISED_BY, ISSUE_STATUS } from "./enums";
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
