import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveChargeState } from "./payments";

const today = new Date("2026-07-11");
const charge = (amount: number, due: string, payments: number[] = []) => ({
  amount,
  dueDate: new Date(due),
  payments: payments.map((amount) => ({ amount })),
});

test("fully paid charge is PAID and not arrears", () => {
  const s = deriveChargeState(charge(1000, "2026-06-01", [1000]), today);
  assert.equal(s.status, "PAID");
  assert.equal(s.isArrears, false);
  assert.equal(s.outstanding, 0);
});

test("partial payment is PARTIAL and counts as arrears", () => {
  const s = deriveChargeState(charge(1000, "2026-06-01", [600]), today);
  assert.equal(s.status, "PARTIAL");
  assert.equal(s.isArrears, true);
  assert.equal(s.outstanding, 400);
});

test("unpaid and 1–60 days overdue is LATE", () => {
  const s = deriveChargeState(charge(1000, "2026-06-15"), today); // ~26 days
  assert.equal(s.status, "LATE");
  assert.equal(s.isArrears, true);
});

test("unpaid and > 60 days overdue is MISSING", () => {
  const s = deriveChargeState(charge(1000, "2026-04-01"), today); // ~100 days
  assert.equal(s.status, "MISSING");
  assert.equal(s.isArrears, true);
});

test("unpaid but not yet due is OPEN, not arrears", () => {
  const s = deriveChargeState(charge(1000, "2026-08-01"), today); // future
  assert.equal(s.status, "OPEN");
  assert.equal(s.isArrears, false);
  assert.equal(s.overdueDays, 0);
});

test("aging bucket reflects days overdue", () => {
  assert.equal(deriveChargeState(charge(1000, "2026-06-20"), today).bucket, "0-30");
  assert.equal(deriveChargeState(charge(1000, "2026-05-20"), today).bucket, "31-60");
  assert.equal(deriveChargeState(charge(1000, "2026-04-20"), today).bucket, "61-90");
  assert.equal(deriveChargeState(charge(1000, "2026-01-20"), today).bucket, "90+");
});

test("partial payment on a not-yet-due charge is not arrears", () => {
  const s = deriveChargeState(charge(1000, "2026-08-01", [200]), today); // future due
  assert.equal(s.status, "PARTIAL");
  assert.equal(s.isArrears, false);
});

test("partial payment on an overdue charge is arrears", () => {
  const s = deriveChargeState(charge(1000, "2026-06-01", [200]), today); // past due
  assert.equal(s.status, "PARTIAL");
  assert.equal(s.isArrears, true);
});
