"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { previewReconciliation, applyReconciliation } from "@/lib/actions";
import type { MatchProposal } from "@/lib/reconcile";
import type { Locale } from "@/lib/enums";
import { clsx } from "clsx";

const SAMPLE = `Datum,Bedrag,Naam,Omschrijving
2026-07-01,"1.480,00",Fysio Centrum Leeuwarden,huur 2026-07
2026-07-02,"850,00",Onbekende Tegenpartij,overboeking`;

const CONF_STYLE: Record<string, string> = {
  HIGH: "bg-emerald-100 text-emerald-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-orange-100 text-orange-700",
  NONE: "bg-slate-100 text-slate-500",
};

export function ReconcilePanel({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [proposals, setProposals] = useState<MatchProposal[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [accepted, setAccepted] = useState<Set<number>>(new Set());
  const [appliedMsg, setAppliedMsg] = useState<string | null>(null);

  const l = {
    paste: locale === "nl" ? "Plak hier de CSV-export van uw bank (Datum, Bedrag, Naam, Omschrijving)…" : "Paste your bank's CSV export here (Date, Amount, Name, Description)…",
    analyse: locale === "nl" ? "Analyseer" : "Analyse",
    sample: locale === "nl" ? "Voorbeeld" : "Sample",
    busy: locale === "nl" ? "Bezig…" : "Working…",
    apply: locale === "nl" ? "Verwerk geselecteerde betalingen" : "Apply selected payments",
    applied: locale === "nl" ? "betalingen verwerkt" : "payments applied",
    tx: locale === "nl" ? "Transactie" : "Transaction",
    matchedTo: locale === "nl" ? "Gekoppeld aan" : "Matched to",
    confidence: locale === "nl" ? "Zekerheid" : "Confidence",
    accept: locale === "nl" ? "Verwerken?" : "Apply?",
    noMatch: locale === "nl" ? "geen koppeling" : "no match",
    date: locale === "nl" ? "Datum" : "Date",
  };

  async function analyse() {
    setBusy(true);
    setAppliedMsg(null);
    try {
      const res = await previewReconciliation(csv);
      setProposals(res.proposals);
      setErrors(res.errors);
      // Pre-accept HIGH and MEDIUM confidence matches.
      const pre = new Set<number>();
      res.proposals.forEach((p, i) => {
        if (p.chargeId && (p.confidence === "HIGH" || p.confidence === "MEDIUM")) pre.add(i);
      });
      setAccepted(pre);
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    if (!proposals) return;
    setBusy(true);
    try {
      const matches = proposals
        .filter((p, i) => accepted.has(i) && p.chargeId)
        .map((p) => ({
          chargeId: p.chargeId!,
          amount: p.tx.amount,
          reference: `${p.tx.name} — ${p.tx.description}`.slice(0, 140),
        }));
      const res = await applyReconciliation(matches);
      setAppliedMsg(`${res.applied} ${l.applied}`);
      setProposals(null);
      setCsv("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={6}
          placeholder={l.paste}
          className="w-full rounded-lg border border-slate-200 p-2 font-mono text-xs outline-none focus:border-brand-400"
        />
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={analyse}
            disabled={busy || !csv.trim()}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? l.busy : l.analyse}
          </button>
          <button onClick={() => setCsv(SAMPLE)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50">
            {l.sample}
          </button>
          {appliedMsg && <span className="text-xs font-semibold text-emerald-600">✓ {appliedMsg}</span>}
        </div>
        {errors.length > 0 && (
          <ul className="mt-2 text-xs text-red-500">
            {errors.slice(0, 5).map((e, i) => (
              <li key={i}>• {e}</li>
            ))}
          </ul>
        )}
      </div>

      {proposals && proposals.length > 0 && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">{l.accept}</th>
                  <th className="th">{l.date}</th>
                  <th className="th">{l.tx}</th>
                  <th className="th text-right">€</th>
                  <th className="th">{l.matchedTo}</th>
                  <th className="th">{l.confidence}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {proposals.map((p, i) => (
                  <tr key={i} className={clsx("hover:bg-slate-50", !p.chargeId && "opacity-60")}>
                    <td className="td text-center">
                      <input
                        type="checkbox"
                        disabled={!p.chargeId}
                        checked={accepted.has(i)}
                        onChange={(e) => {
                          const next = new Set(accepted);
                          e.target.checked ? next.add(i) : next.delete(i);
                          setAccepted(next);
                        }}
                      />
                    </td>
                    <td className="td text-xs">{p.tx.date}</td>
                    <td className="td">
                      <div className="font-medium text-slate-800">{p.tx.name || "—"}</div>
                      <div className="text-xs text-slate-400">{p.tx.description}</div>
                    </td>
                    <td className="td text-right tabular-nums">
                      {new Intl.NumberFormat(locale === "nl" ? "nl-NL" : "en-GB", { style: "currency", currency: "EUR" }).format(p.tx.amount)}
                    </td>
                    <td className="td">
                      {p.charge ? (
                        <>
                          <div className="font-medium text-slate-800">{p.charge.tenant}</div>
                          <div className="text-xs text-slate-400">
                            {p.charge.property} · {p.charge.periodYm}
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">{l.noMatch}</span>
                      )}
                    </td>
                    <td className="td">
                      <span className={clsx("badge", CONF_STYLE[p.confidence])}>{p.confidence}</span>
                      {p.reasons.length > 0 && <div className="mt-0.5 text-[10px] text-slate-400">{p.reasons.join(", ")}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 p-3">
            <button
              onClick={apply}
              disabled={busy || accepted.size === 0}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? l.busy : `${l.apply} (${accepted.size})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
