"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { getRole, can } from "./rbac";
import { audit } from "./audit";

function assertLeases() {
  if (!can("manageLeases", getRole())) throw new Error("Not permitted: manageLeases");
}

/** Create an active lease on a vacant unit, creating the tenant if new. */
export async function createLease(formData: FormData): Promise<{ error?: string }> {
  assertLeases();
  const unitId = String(formData.get("unitId") ?? "");
  const tenantId = String(formData.get("tenantId") ?? "");
  const newTenant = String(formData.get("newTenant") ?? "").trim().slice(0, 160);
  const monthlyRent = Number(formData.get("monthlyRent"));
  const serviceCharge = Number(formData.get("serviceCharge") ?? 0) || 0;
  const startStr = String(formData.get("startDate") ?? "");
  const endStr = String(formData.get("endDate") ?? "");
  const indexationClause = formData.get("indexationClause") === "on";

  if (!unitId || !Number.isFinite(monthlyRent) || monthlyRent <= 0 || !startStr) return { error: "invalid" };
  if (!tenantId && !newTenant) return { error: "tenant_required" };

  const unit = await prisma.unit.findUnique({ where: { id: unitId }, include: { leases: true, property: true } });
  if (!unit) return { error: "invalid" };
  if (unit.leases.some((l) => l.status === "ACTIVE")) return { error: "occupied" };

  let tid = tenantId;
  if (!tid) {
    const t = await prisma.tenant.create({ data: { name: newTenant } });
    tid = t.id;
  }

  const start = new Date(startStr);
  const nextReview = new Date(start);
  nextReview.setFullYear(nextReview.getFullYear() + 1);

  await prisma.lease.create({
    data: {
      unitId,
      tenantId: tid,
      startDate: start,
      endDate: endStr ? new Date(endStr) : null,
      monthlyRent,
      serviceCharge,
      deposit: monthlyRent * 3,
      indexationClause,
      lastIndexedAt: start,
      nextReviewDate: nextReview,
      status: "ACTIVE",
    },
  });
  await audit("LEASE_CREATED", `Lease on ${unit.property.name} / ${unit.label} — €${Math.round(monthlyRent + serviceCharge)}/mo`);
  revalidatePath(`/properties/${unit.propertyId}`);
  revalidatePath("/");
  return {};
}

/** End an active lease (marks it ENDED as of today). */
export async function endLease(formData: FormData) {
  assertLeases();
  const id = String(formData.get("id") ?? "");
  const lease = await prisma.lease.findUnique({ where: { id }, include: { unit: true } });
  if (!lease || lease.status !== "ACTIVE") return;
  await prisma.lease.update({ where: { id }, data: { status: "ENDED", endDate: new Date() } });
  await audit("LEASE_ENDED", `Lease ended on unit ${lease.unit.label}`);
  revalidatePath(`/properties/${lease.unit.propertyId}`);
  revalidatePath("/");
}
