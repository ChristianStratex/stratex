// Monthly rent-charge generation: for every active lease, ensure a RentCharge
// exists for the given period. Idempotent (unique on leaseId+periodYm), so it
// can run from a cron, a manual button, or both.

import { prisma } from "./db";

export interface LeasePeriodLike {
  status: string;
  startDate: Date;
  endDate: Date | null;
}

export function periodYmOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function periodStart(periodYm: string): Date {
  const [y, m] = periodYm.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

/** A lease owes rent for a period when it is active and the period overlaps its term. */
export function leaseOwesForPeriod(lease: LeasePeriodLike, periodYm: string): boolean {
  if (lease.status !== "ACTIVE") return false;
  const start = periodStart(periodYm);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0); // last day of month
  if (lease.startDate > end) return false;
  if (lease.endDate && lease.endDate < start) return false;
  return true;
}

/**
 * Ensure charges exist for the period (default: current month).
 * Returns how many were created and how many already existed.
 */
export async function generateChargesForPeriod(periodYm = periodYmOf(new Date())) {
  const leases = await prisma.lease.findMany({
    include: { rentCharges: { where: { periodYm }, select: { id: true } } },
  });

  let created = 0;
  let existing = 0;
  const due = periodStart(periodYm);

  for (const lease of leases) {
    if (!leaseOwesForPeriod(lease, periodYm)) continue;
    if (lease.rentCharges.length > 0) {
      existing++;
      continue;
    }
    await prisma.rentCharge.create({
      data: {
        leaseId: lease.id,
        periodYm,
        dueDate: due,
        amount: lease.monthlyRent + lease.serviceCharge,
        status: "OPEN",
      },
    });
    created++;
  }
  return { periodYm, created, existing };
}
