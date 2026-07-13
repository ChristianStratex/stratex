"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./db";
import { getRole, can } from "./rbac";
import { computeIndexation, isIndexationDue } from "./indexation";

function assertLeases() {
  if (!can("manageLeases", getRole())) throw new Error("Not permitted: manageLeases");
}

export interface IndexationCandidate {
  leaseId: string;
  tenant: string;
  property: string;
  propertyId: string;
  unit: string;
  currentRent: number;
  nextReviewDate: string; // ISO
  overdue: boolean;
}

/** Active leases whose indexation is due (past review date or within 60 days). */
export async function getIndexationCandidates(): Promise<IndexationCandidate[]> {
  const now = new Date();
  const leases = await prisma.lease.findMany({
    where: { status: "ACTIVE", indexationClause: true },
    include: { tenant: true, unit: { include: { property: true } } },
  });
  return leases
    .filter((l) => isIndexationDue(l, now))
    .map((l) => ({
      leaseId: l.id,
      tenant: l.tenant.name,
      property: l.unit.property.name,
      propertyId: l.unit.property.id,
      unit: l.unit.label,
      currentRent: l.monthlyRent,
      nextReviewDate: (l.nextReviewDate as Date).toISOString(),
      overdue: (l.nextReviewDate as Date) < now,
    }))
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate));
}

/**
 * Apply CPI indexation to the given leases: raise rent, stamp lastIndexedAt,
 * advance nextReviewDate one year. Returns count + total annual uplift.
 */
export async function applyIndexation(
  leaseIds: string[],
  cpiPct: number,
): Promise<{ applied: number; annualUplift: number }> {
  assertLeases();
  const pct = Number(cpiPct);
  if (!Number.isFinite(pct) || pct < 0 || pct > 25) throw new Error("CPI out of range");

  const now = new Date();
  let applied = 0;
  let annualUplift = 0;
  for (const id of leaseIds) {
    const lease = await prisma.lease.findUnique({ where: { id } });
    if (!lease || !isIndexationDue(lease, now)) continue;
    const p = computeIndexation(lease.monthlyRent, pct);
    const nextReview = new Date(lease.nextReviewDate as Date);
    nextReview.setFullYear(nextReview.getFullYear() + 1);
    await prisma.lease.update({
      where: { id },
      data: { monthlyRent: p.newRent, lastIndexedAt: now, nextReviewDate: nextReview },
    });
    applied++;
    annualUplift += p.annualDelta;
  }
  revalidatePath("/indexation");
  revalidatePath("/");
  return { applied, annualUplift: Math.round(annualUplift * 100) / 100 };
}
