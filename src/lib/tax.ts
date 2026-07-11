// Tax-structure scenario calculator: personal (Box 3) vs. holding via a BV.
// All rates are PARAMETERIZED and dated so they can be updated as Dutch law evolves
// (esp. the Wet werkelijk rendement box 3, targeted 2028 but not yet locked).
//
// IMPORTANT: informational modelling only — NOT tax advice.

export interface TaxRates {
  // Box 3 — current forfaitary regime (2025–2027)
  box3ForfaitRate: number; // fictional return on "overige bezittingen" (e.g. 0.06)
  box3TaxRate: number; // rate applied to the fictional return (e.g. 0.36)
  // Box 3 — proposed "werkelijk rendement" (2028+)
  box3RealRate: number; // tax on actual net rental income (e.g. 0.36)
  box3CapGainsRate: number; // tax on realised capital gain at sale (e.g. 0.36)
  // BV route
  vpbLowRate: number; // corporate tax up to threshold (e.g. 0.19)
  vpbHighRate: number; // corporate tax above threshold (e.g. 0.258)
  vpbThreshold: number; // profit threshold in EUR (e.g. 200000)
  box2LowRate: number; // dividend tax low bracket (e.g. 0.245)
  box2HighRate: number; // dividend tax high bracket (e.g. 0.31)
  box2Threshold: number; // e.g. 68843
  // Transfer tax to move property INTO a BV
  ovbResidential: number; // e.g. 0.08 (from 2026)
  ovbCommercial: number; // e.g. 0.104
}

// Defaults reflect researched 2026 figures; editable in the UI.
export const DEFAULT_RATES: TaxRates = {
  box3ForfaitRate: 0.06,
  box3TaxRate: 0.36,
  box3RealRate: 0.36,
  box3CapGainsRate: 0.36,
  vpbLowRate: 0.19,
  vpbHighRate: 0.258,
  vpbThreshold: 200000,
  box2LowRate: 0.245,
  box2HighRate: 0.31,
  box2Threshold: 68843,
  ovbResidential: 0.08,
  ovbCommercial: 0.104,
};

export interface ScenarioInput {
  wozValue: number; // current value of the property
  annualNetRent: number; // rent minus deductible costs & interest (EUR/yr)
  annualAppreciation: number; // expected value growth rate (e.g. 0.03)
  years: number; // holding horizon
  isResidential: boolean; // determines OVB rate if moving into a BV
  regime: "FORFAIT_2027" | "WERKELIJK_2028"; // which Box 3 regime for the personal case
  distributeProfits: boolean; // BV: pay out annually (adds Box 2) vs. retain (defer)
}

export interface ScenarioResult {
  personalTaxTotal: number;
  bvTaxTotal: number;
  bvEntryOvb: number;
  personalNetAfterTax: number;
  bvNetAfterTax: number;
  advantageBV: number; // positive = BV better over the horizon
  breakEvenYear: number | null;
  perYear: { year: number; personalCum: number; bvCum: number }[];
}

function box2Rate(profit: number, r: TaxRates): number {
  // Blended effective rate — simplified to the low bracket up to threshold.
  return profit <= r.box2Threshold ? r.box2LowRate : r.box2HighRate;
}

function vpbRate(profit: number, r: TaxRates): number {
  return profit <= r.vpbThreshold ? r.vpbLowRate : r.vpbHighRate;
}

export function runScenario(input: ScenarioInput, rates: TaxRates = DEFAULT_RATES): ScenarioResult {
  const r = rates;
  const ovbRate = input.isResidential ? r.ovbResidential : r.ovbCommercial;
  const bvEntryOvb = input.wozValue * ovbRate;

  let personalTaxCum = 0;
  let bvTaxCum = bvEntryOvb; // BV pays the transfer tax up front
  let value = input.wozValue;
  const perYear: ScenarioResult["perYear"] = [];
  let breakEvenYear: number | null = null;

  for (let y = 1; y <= input.years; y++) {
    const startValue = value;
    value = value * (1 + input.annualAppreciation);
    const gainThisYear = value - startValue;

    // --- Personal ---
    let personalTaxThisYear = 0;
    if (input.regime === "FORFAIT_2027") {
      // Taxed on fictional return of value, ignores actual rent/gain.
      personalTaxThisYear = startValue * r.box3ForfaitRate * r.box3TaxRate;
    } else {
      // Werkelijk rendement: tax actual net rent yearly; capital gain taxed at sale.
      personalTaxThisYear = input.annualNetRent * r.box3RealRate;
      if (y === input.years) {
        const totalGain = value - input.wozValue;
        personalTaxThisYear += totalGain * r.box3CapGainsRate;
      }
    }
    personalTaxCum += personalTaxThisYear;

    // --- BV ---
    const corpProfit = input.annualNetRent;
    let bvTaxThisYear = corpProfit * vpbRate(corpProfit, r);
    if (input.distributeProfits) {
      const afterVpb = corpProfit * (1 - vpbRate(corpProfit, r));
      bvTaxThisYear += afterVpb * box2Rate(afterVpb, r);
    }
    if (y === input.years) {
      // Realise capital gain inside the BV at corporate rate on sale.
      const totalGain = value - input.wozValue;
      bvTaxThisYear += totalGain * vpbRate(totalGain, r);
    }
    bvTaxCum += bvTaxThisYear;

    perYear.push({ year: y, personalCum: personalTaxCum, bvCum: bvTaxCum });
    if (breakEvenYear === null && bvTaxCum <= personalTaxCum) breakEvenYear = y;
  }

  const grossReturn = input.annualNetRent * input.years + (value - input.wozValue);
  return {
    personalTaxTotal: personalTaxCum,
    bvTaxTotal: bvTaxCum,
    bvEntryOvb,
    personalNetAfterTax: grossReturn - personalTaxCum,
    bvNetAfterTax: grossReturn - bvTaxCum,
    advantageBV: personalTaxCum - bvTaxCum,
    breakEvenYear,
    perYear,
  };
}
