import { test } from "node:test";
import assert from "node:assert/strict";
import { leaseOwesForPeriod, periodYmOf, periodStart } from "./charge-gen";

const lease = (over: Partial<{ status: string; startDate: Date; endDate: Date | null }> = {}) => ({
  status: "ACTIVE",
  startDate: new Date("2024-01-01"),
  endDate: null as Date | null,
  ...over,
});

test("periodYmOf / periodStart round-trip", () => {
  assert.equal(periodYmOf(new Date(2026, 6, 15)), "2026-07");
  assert.deepEqual(periodStart("2026-07"), new Date(2026, 6, 1));
});

test("active open-ended lease owes for any current period", () => {
  assert.ok(leaseOwesForPeriod(lease(), "2026-07"));
});

test("lease not yet started does not owe", () => {
  assert.ok(!leaseOwesForPeriod(lease({ startDate: new Date("2026-09-01") }), "2026-07"));
});

test("lease starting mid-month owes for that month", () => {
  assert.ok(leaseOwesForPeriod(lease({ startDate: new Date("2026-07-20") }), "2026-07"));
});

test("ended lease does not owe after its end", () => {
  assert.ok(!leaseOwesForPeriod(lease({ endDate: new Date("2026-05-31") }), "2026-07"));
});

test("lease ending mid-month still owes for that month", () => {
  assert.ok(leaseOwesForPeriod(lease({ endDate: new Date("2026-07-10") }), "2026-07"));
});

test("inactive lease never owes", () => {
  assert.ok(!leaseOwesForPeriod(lease({ status: "ENDED" }), "2026-07"));
});

test("lease starting on the last day of the month still owes (no TZ skip)", () => {
  assert.ok(leaseOwesForPeriod(lease({ startDate: new Date("2026-07-31T00:00:00Z") }), "2026-07"));
});
