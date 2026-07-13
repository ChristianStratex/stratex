// Rent indexation: Dutch leases typically index rent annually by CPI
// (CBS consumentenprijsindex). The CPI percentage is a parameter here;
// a CBS data feed can populate it automatically later.

export interface IndexationProposal {
  currentRent: number;
  cpiPct: number; // e.g. 3.0
  newRent: number;
  monthlyDelta: number;
  annualDelta: number;
}

/** Compute the indexed rent, rounded to whole cents. */
export function computeIndexation(currentRent: number, cpiPct: number): IndexationProposal {
  const newRent = Math.round(currentRent * (1 + cpiPct / 100) * 100) / 100;
  const monthlyDelta = Math.round((newRent - currentRent) * 100) / 100;
  return {
    currentRent,
    cpiPct,
    newRent,
    monthlyDelta,
    annualDelta: Math.round(monthlyDelta * 12 * 100) / 100,
  };
}

export interface LeaseLike {
  status: string;
  indexationClause: boolean;
  nextReviewDate: Date | null;
}

/**
 * A lease is due for indexation when it is active, has an indexation clause,
 * and its review date is past or within the look-ahead window.
 */
export function isIndexationDue(lease: LeaseLike, now: Date, lookAheadDays = 60): boolean {
  if (lease.status !== "ACTIVE" || !lease.indexationClause || !lease.nextReviewDate) return false;
  const horizon = new Date(now.getTime() + lookAheadDays * 86_400_000);
  return lease.nextReviewDate <= horizon;
}
