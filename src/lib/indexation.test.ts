import { test } from "node:test";
import assert from "node:assert/strict";
import { computeIndexation, isIndexationDue } from "./indexation";

test("computeIndexation applies CPI and rounds to cents", () => {
  const p = computeIndexation(1000, 3);
  assert.equal(p.newRent, 1030);
  assert.equal(p.monthlyDelta, 30);
  assert.equal(p.annualDelta, 360);
});

test("computeIndexation handles fractional results", () => {
  const p = computeIndexation(1234.56, 2.7);
  assert.equal(p.newRent, 1267.89); // 1234.56 * 1.027 = 1267.893...
  assert.equal(p.monthlyDelta, 33.33);
});

test("zero CPI changes nothing", () => {
  const p = computeIndexation(950, 0);
  assert.equal(p.newRent, 950);
  assert.equal(p.annualDelta, 0);
});

const now = new Date("2026-07-13");

test("due when review date is past", () => {
  assert.ok(isIndexationDue({ status: "ACTIVE", indexationClause: true, nextReviewDate: new Date("2026-06-01") }, now));
});

test("due when review date is within look-ahead window", () => {
  assert.ok(isIndexationDue({ status: "ACTIVE", indexationClause: true, nextReviewDate: new Date("2026-08-15") }, now));
});

test("not due when review date is beyond the window", () => {
  assert.ok(!isIndexationDue({ status: "ACTIVE", indexationClause: true, nextReviewDate: new Date("2027-01-01") }, now));
});

test("not due without clause, without date, or when lease inactive", () => {
  assert.ok(!isIndexationDue({ status: "ACTIVE", indexationClause: false, nextReviewDate: new Date("2026-06-01") }, now));
  assert.ok(!isIndexationDue({ status: "ACTIVE", indexationClause: true, nextReviewDate: null }, now));
  assert.ok(!isIndexationDue({ status: "ENDED", indexationClause: true, nextReviewDate: new Date("2026-06-01") }, now));
});
