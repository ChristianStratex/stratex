// Pure payment/charge logic — no DB dependency, so it is unit-testable.
import { daysBetween, agingBucket } from "./format";

export type ChargeStatus = "PAID" | "PARTIAL" | "LATE" | "MISSING" | "OPEN";

export interface ChargeLike {
  amount: number;
  dueDate: Date;
  payments: { amount: number }[];
}

export interface ChargeState {
  paid: number;
  outstanding: number;
  overdueDays: number;
  bucket: ReturnType<typeof agingBucket>;
  status: ChargeStatus;
  isArrears: boolean;
}

/**
 * Derive the settlement state of a rent charge as of `today`.
 * - PAID: fully covered
 * - PARTIAL: some paid, some outstanding
 * - LATE: nothing paid, 1–60 days overdue
 * - MISSING: nothing paid, > 60 days overdue
 * - OPEN: not yet due, nothing paid
 */
export function deriveChargeState(charge: ChargeLike, today: Date): ChargeState {
  const paid = charge.payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, charge.amount - paid);
  const overdueDays = charge.dueDate < today ? daysBetween(today, charge.dueDate) : 0;

  let status: ChargeStatus;
  if (outstanding <= 0.01) status = "PAID";
  else if (paid > 0) status = "PARTIAL";
  else if (overdueDays > 60) status = "MISSING";
  else if (overdueDays > 0) status = "LATE";
  else status = "OPEN";

  const isArrears = status === "LATE" || status === "MISSING" || status === "PARTIAL";
  return { paid, outstanding, overdueDays, bucket: agingBucket(overdueDays), status, isArrears };
}
