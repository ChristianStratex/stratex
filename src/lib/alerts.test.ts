import { test } from "node:test";
import assert from "node:assert/strict";
import { arrearsSeverity, expirySeverity, issueSeverity, sortAlerts, type Alert } from "./alerts";

test("arrears severity scales with amount", () => {
  assert.equal(arrearsSeverity(15000), "CRITICAL");
  assert.equal(arrearsSeverity(5000), "HIGH");
  assert.equal(arrearsSeverity(800), "MEDIUM");
});

test("expiry severity scales with proximity", () => {
  const now = new Date("2026-07-13");
  assert.equal(expirySeverity(new Date("2026-08-15"), now), "HIGH"); // ~33 days
  assert.equal(expirySeverity(new Date("2026-10-15"), now), "MEDIUM"); // ~94 days
  assert.equal(expirySeverity(new Date("2027-03-01"), now), "LOW"); // ~231 days
});

test("issue severity follows priority", () => {
  assert.equal(issueSeverity("URGENT"), "CRITICAL");
  assert.equal(issueSeverity("HIGH"), "HIGH");
  assert.equal(issueSeverity("LOW"), "LOW");
});

test("sortAlerts orders by severity then amount", () => {
  const mk = (severity: Alert["severity"], amount?: number): Alert => ({
    severity,
    kind: "ARREARS",
    title: "x",
    detail: "y",
    propertyId: "p",
    href: "/",
    amount,
  });
  const sorted = sortAlerts([mk("LOW"), mk("CRITICAL", 100), mk("HIGH"), mk("CRITICAL", 900)]);
  assert.equal(sorted[0].severity, "CRITICAL");
  assert.equal(sorted[0].amount, 900);
  assert.equal(sorted[3].severity, "LOW");
});
