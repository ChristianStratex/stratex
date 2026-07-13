"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { applyIndexation, type IndexationCandidate } from "@/lib/indexation-actions";
import { computeIndexation } from "@/lib/indexation";
import type { Locale } from "@/lib/enums";

function eur(v: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "nl" ? "nl-NL" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(v);
}

export function IndexationPanel({
  candidates,
  canApply,
  locale,
}: {
  candidates: IndexationCandidate[];
  canApply: boolean;
  locale: Locale;
}) {
  const nl = locale === "nl";
  const router = useRouter();
  const [cpi, setCpi] = useState(3.0);
  // Only leases whose review date has passed can actually be applied; upcoming
  // ones are shown for planning but start unselected.
  const [selected, setSelected] = useState<Set<string>>(
    new Set(candidates.filter((c) => c.overdue).map((c) => c.leaseId)),
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const totals = useMemo(() => {
    let monthly = 0;
    let annual = 0;
    for (const c of candidates) {
      if (!selected.has(c.leaseId)) continue;
      const p = computeIndexation(c.currentRent, cpi);
      monthly += p.monthlyDelta;
      annual += p.annualDelta;
    }
    return { monthly, annual };
  }, [candidates, selected, cpi]);

  async function apply() {
    setBusy(true);
    setResult(null);
    try {
      const res = await applyIndexation([...selected], cpi);
      setResult(
        nl
          ? `${res.applied} contracten geïndexeerd — ${eur(res.annualUplift, locale)} extra huur per jaar.`
          : `${res.applied} leases indexed — ${eur(res.annualUplift, locale)} additional rent per year.`,
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card flex flex-wrap items-center gap-4 p-4">
        <label className="text-sm font-medium text-slate-700">
          CPI %
          <input
            type="number"
            min={0}
            max={25}
            step={0.1}
            value={cpi}
            onChange={(e) => setCpi(Number(e.target.value))}
            className="ml-2 w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </label>
        <div className="text-sm text-slate-500">
          {nl ? "Geselecteerde verhoging" : "Selected uplift"}:{" "}
          <span className="font-semibold text-emerald-600">{eur(totals.monthly, locale)}</span> /{nl ? "mnd" : "mo"} ·{" "}
          <span className="font-semibold text-emerald-600">{eur(totals.annual, locale)}</span> /{nl ? "jaar" : "yr"}
        </div>
        {canApply && (
          <button
            onClick={apply}
            disabled={busy || selected.size === 0}
            className="ml-auto rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? (nl ? "Bezig…" : "Applying…") : nl ? `Indexeer ${selected.size} contracten` : `Index ${selected.size} leases`}
          </button>
        )}
      </div>
      {result && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">✓ {result}</div>}

      {candidates.length === 0 ? (
        <div className="card p-6 text-center text-sm text-emerald-600">
          ✓ {nl ? "Geen contracten met openstaande indexatie." : "No leases due for indexation."}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th"></th>
                  <th className="th">{nl ? "Pand" : "Property"}</th>
                  <th className="th">{nl ? "Huurder" : "Tenant"}</th>
                  <th className="th">{nl ? "Herzieningsdatum" : "Review date"}</th>
                  <th className="th text-right">{nl ? "Huidige huur" : "Current rent"}</th>
                  <th className="th text-right">{nl ? "Nieuwe huur" : "New rent"}</th>
                  <th className="th text-right">Δ /{nl ? "jaar" : "yr"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {candidates.map((c) => {
                  const p = computeIndexation(c.currentRent, cpi);
                  return (
                    <tr key={c.leaseId} className="hover:bg-slate-50">
                      <td className="td text-center">
                        <input
                          type="checkbox"
                          checked={selected.has(c.leaseId)}
                          onChange={(e) => {
                            const next = new Set(selected);
                            e.target.checked ? next.add(c.leaseId) : next.delete(c.leaseId);
                            setSelected(next);
                          }}
                        />
                      </td>
                      <td className="td">
                        <Link href={`/properties/${c.propertyId}`} className="font-medium text-brand-700 hover:underline">
                          {c.property}
                        </Link>
                        <div className="text-xs text-slate-400">{c.unit}</div>
                      </td>
                      <td className="td">{c.tenant}</td>
                      <td className="td">
                        {new Date(c.nextReviewDate).toLocaleDateString(nl ? "nl-NL" : "en-GB")}
                        {c.overdue && (
                          <span className="badge ml-2 bg-red-100 text-red-700">{nl ? "verlopen" : "overdue"}</span>
                        )}
                      </td>
                      <td className="td text-right tabular-nums">{eur(c.currentRent, locale)}</td>
                      <td className="td text-right tabular-nums font-medium">{eur(p.newRent, locale)}</td>
                      <td className="td text-right tabular-nums text-emerald-600">+{eur(p.annualDelta, locale)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
