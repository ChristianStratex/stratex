import { test } from "node:test";
import assert from "node:assert/strict";
import { runScenario, DEFAULT_RATES, type ScenarioInput } from "./tax";

const base: ScenarioInput = {
  wozValue: 1_000_000,
  annualNetRent: 60_000,
  annualAppreciation: 0.03,
  years: 10,
  isResidential: false,
  regime: "WERKELIJK_2028",
  distributeProfits: false,
};

test("commercial property pays 10.4% transfer tax to enter a BV", () => {
  const r = runScenario({ ...base, isResidential: false });
  assert.equal(Math.round(r.bvEntryOvb), Math.round(1_000_000 * DEFAULT_RATES.ovbCommercial));
});

test("residential property pays the lower 8% transfer tax", () => {
  const r = runScenario({ ...base, isResidential: true });
  assert.equal(Math.round(r.bvEntryOvb), Math.round(1_000_000 * DEFAULT_RATES.ovbResidential));
});

test("Box 3 forfait taxes value, ignoring actual rent", () => {
  // 1 year, forfait: tax = value * 6% * 36% ≈ 21,600 regardless of rent.
  const r = runScenario({ ...base, years: 1, regime: "FORFAIT_2027" });
  const expected = 1_000_000 * DEFAULT_RATES.box3ForfaitRate * DEFAULT_RATES.box3TaxRate;
  assert.equal(Math.round(r.personalTaxTotal), Math.round(expected));
});

test("retaining profit in the BV defers tax vs. distributing it", () => {
  const retain = runScenario({ ...base, distributeProfits: false });
  const distribute = runScenario({ ...base, distributeProfits: true });
  assert.ok(
    distribute.bvTaxTotal > retain.bvTaxTotal,
    "distributing should add Box 2 tax on top of Vpb",
  );
});

test("advantageBV is consistent with the two tax totals", () => {
  const r = runScenario(base);
  assert.equal(Math.round(r.advantageBV), Math.round(r.personalTaxTotal - r.bvTaxTotal));
});

test("longer horizon with strong appreciation favours the BV (deferral compounds)", () => {
  const short = runScenario({ ...base, years: 2, annualAppreciation: 0.05 });
  const long = runScenario({ ...base, years: 25, annualAppreciation: 0.05 });
  assert.ok(long.advantageBV > short.advantageBV);
});

test("perYear series length matches the horizon", () => {
  const r = runScenario({ ...base, years: 12 });
  assert.equal(r.perYear.length, 12);
});
