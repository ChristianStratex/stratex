"use client";

import { useMemo, useState } from "react";
import { runScenario, DEFAULT_RATES, type ScenarioInput } from "@/lib/tax";
import { ComparisonChart } from "@/components/Charts";
import type { Locale } from "@/lib/enums";

function euro(v: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "nl" ? "nl-NL" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(v);
}

const txt = {
  nl: {
    inputs: "Uitgangspunten",
    woz: "Waarde pand (WOZ)",
    rent: "Netto huur per jaar",
    appr: "Waardegroei per jaar",
    years: "Horizon (jaren)",
    residential: "Woning (anders: commercieel)",
    regime: "Box 3-regime (privé)",
    forfait: "Forfaitair (t/m 2027)",
    werkelijk: "Werkelijk rendement (2028+)",
    distribute: "BV: winst jaarlijks uitkeren",
    personal: "Privé (Box 3)",
    bv: "Via B.V.",
    totalTax: "Totale belasting",
    entryOvb: "Overdrachtsbelasting (instap)",
    netAfter: "Netto na belasting",
    advantage: "Voordeel B.V. over horizon",
    breakeven: "Break-even",
    year: "jaar",
    noBreakeven: "geen binnen horizon",
    cumTax: "Cumulatieve belasting per jaar",
    verdict_bv: "Op basis van deze aannames is de B.V.-structuur voordeliger.",
    verdict_personal: "Op basis van deze aannames is privé bezit voordeliger.",
  },
  en: {
    inputs: "Assumptions",
    woz: "Property value (WOZ)",
    rent: "Net rent per year",
    appr: "Annual appreciation",
    years: "Horizon (years)",
    residential: "Residential (else: commercial)",
    regime: "Box 3 regime (personal)",
    forfait: "Forfaitary (until 2027)",
    werkelijk: "Actual return (2028+)",
    distribute: "BV: distribute profit yearly",
    personal: "Personal (Box 3)",
    bv: "Via a BV",
    totalTax: "Total tax",
    entryOvb: "Transfer tax (entry)",
    netAfter: "Net after tax",
    advantage: "BV advantage over horizon",
    breakeven: "Break-even",
    year: "year",
    noBreakeven: "none within horizon",
    cumTax: "Cumulative tax per year",
    verdict_bv: "Under these assumptions, the BV structure is more favourable.",
    verdict_personal: "Under these assumptions, personal ownership is more favourable.",
  },
};

export function TaxCalculator({ locale }: { locale: Locale }) {
  const l = txt[locale];
  const [input, setInput] = useState<ScenarioInput>({
    wozValue: 1500000,
    annualNetRent: 90000,
    annualAppreciation: 0.03,
    years: 15,
    isResidential: false,
    regime: "WERKELIJK_2028",
    distributeProfits: false,
  });

  const result = useMemo(() => runScenario(input, DEFAULT_RATES), [input]);
  const chartData = result.perYear.map((p) => ({
    year: p.year,
    personal: p.personalCum,
    bv: p.bvCum,
  }));
  const bvWins = result.advantageBV > 0;

  const set = <K extends keyof ScenarioInput>(k: K, v: ScenarioInput[K]) =>
    setInput((s) => ({ ...s, [k]: v }));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Inputs */}
      <div className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold text-slate-700">{l.inputs}</h2>

        <Field label={`${l.woz}: ${euro(input.wozValue, locale)}`}>
          <input type="range" min={200000} max={10000000} step={50000} value={input.wozValue}
            onChange={(e) => set("wozValue", Number(e.target.value))} className="w-full" />
        </Field>

        <Field label={`${l.rent}: ${euro(input.annualNetRent, locale)}`}>
          <input type="range" min={0} max={600000} step={5000} value={input.annualNetRent}
            onChange={(e) => set("annualNetRent", Number(e.target.value))} className="w-full" />
        </Field>

        <Field label={`${l.appr}: ${(input.annualAppreciation * 100).toFixed(1)}%`}>
          <input type="range" min={0} max={0.08} step={0.005} value={input.annualAppreciation}
            onChange={(e) => set("annualAppreciation", Number(e.target.value))} className="w-full" />
        </Field>

        <Field label={`${l.years}: ${input.years}`}>
          <input type="range" min={1} max={30} step={1} value={input.years}
            onChange={(e) => set("years", Number(e.target.value))} className="w-full" />
        </Field>

        <label className="block text-xs font-medium text-slate-600">
          {l.regime}
          <select value={input.regime} onChange={(e) => set("regime", e.target.value as ScenarioInput["regime"])}
            className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
            <option value="FORFAIT_2027">{l.forfait}</option>
            <option value="WERKELIJK_2028">{l.werkelijk}</option>
          </select>
        </label>

        <Toggle checked={input.isResidential} onChange={(v) => set("isResidential", v)} label={l.residential} />
        <Toggle checked={input.distributeProfits} onChange={(v) => set("distributeProfits", v)} label={l.distribute} />
      </div>

      {/* Results */}
      <div className="space-y-4 lg:col-span-2">
        <div className="grid grid-cols-2 gap-3">
          <ResultCard title={l.personal} tone="purple">
            <Row label={l.totalTax} value={euro(result.personalTaxTotal, locale)} />
            <Row label={l.netAfter} value={euro(result.personalNetAfterTax, locale)} strong />
          </ResultCard>
          <ResultCard title={l.bv} tone="brand">
            <Row label={l.totalTax} value={euro(result.bvTaxTotal, locale)} />
            <Row label={l.entryOvb} value={euro(result.bvEntryOvb, locale)} />
            <Row label={l.netAfter} value={euro(result.bvNetAfterTax, locale)} strong />
          </ResultCard>
        </div>

        <div className={`rounded-xl border p-4 text-sm font-medium ${bvWins ? "border-brand-200 bg-brand-50 text-brand-800" : "border-purple-200 bg-purple-50 text-purple-800"}`}>
          {bvWins ? l.verdict_bv : l.verdict_personal}
          <div className="mt-1 text-xs font-normal opacity-80">
            {l.advantage}: {euro(Math.abs(result.advantageBV), locale)} · {l.breakeven}:{" "}
            {result.breakEvenYear ? `${l.year} ${result.breakEvenYear}` : l.noBreakeven}
          </div>
        </div>

        <div className="card p-4">
          <div className="mb-1 text-sm font-semibold text-slate-700">{l.cumTax}</div>
          <ComparisonChart data={chartData} personalLabel={l.personal} bvLabel={l.bv} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-slate-600">{label}</div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs font-medium text-slate-600">
      <span>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-brand-600" : "bg-slate-300"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${checked ? "left-4.5" : "left-0.5"}`} style={{ left: checked ? 18 : 2 }} />
      </button>
    </label>
  );
}

function ResultCard({ title, tone, children }: { title: string; tone: "brand" | "purple"; children: React.ReactNode }) {
  const border = tone === "brand" ? "border-brand-200" : "border-purple-200";
  return (
    <div className={`card border-2 ${border} p-4`}>
      <div className="mb-2 text-sm font-semibold text-slate-700">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={strong ? "font-semibold text-slate-900" : "text-slate-700"}>{value}</span>
    </div>
  );
}
