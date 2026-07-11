"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { importProperties, type ImportResult } from "@/lib/actions";
import type { Locale } from "@/lib/enums";

const SAMPLE = `Name,Street,PostalCode,City,Type,Owner,OwnerType,WOZValue,PurchasePrice,MonthlyCost
Kantoor Voorbeeld,Voorbeeldstraat 1,8900 AA,Leeuwarden,OFFICE,Voorbeeld B.V.,BV,1500000,1200000,1800
Winkel Voorbeeld,Marktplein 2,8600 BB,Sneek,RETAIL,Voorbeeld B.V.,BV,900000,750000,700`;

export function ImportPanel({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const l = {
    heading: locale === "nl" ? "Panden importeren (CSV)" : "Import properties (CSV)",
    hint:
      locale === "nl"
        ? "Plak CSV met kolommen: Name, Street, PostalCode, City, Type, Owner, OwnerType, WOZValue, PurchasePrice, MonthlyCost. Onbekende eigenaren worden automatisch aangemaakt."
        : "Paste CSV with columns: Name, Street, PostalCode, City, Type, Owner, OwnerType, WOZValue, PurchasePrice, MonthlyCost. Unknown owners are created automatically.",
    sample: locale === "nl" ? "Voorbeeld invullen" : "Fill sample",
    run: locale === "nl" ? "Importeren" : "Import",
    busy: locale === "nl" ? "Bezig…" : "Importing…",
    created: locale === "nl" ? "aangemaakt" : "created",
    skipped: locale === "nl" ? "overgeslagen" : "skipped",
  };

  async function run() {
    setBusy(true);
    setResult(null);
    try {
      const res = await importProperties(csv);
      setResult(res);
      if (res.created > 0) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card p-4">
      <h2 className="text-sm font-semibold text-slate-700">{l.heading}</h2>
      <p className="mt-1 text-xs text-slate-400">{l.hint}</p>
      <textarea
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={6}
        placeholder="Name,Street,PostalCode,City,Type,Owner,OwnerType,WOZValue,PurchasePrice,MonthlyCost"
        className="mt-2 w-full rounded-lg border border-slate-200 p-2 font-mono text-xs outline-none focus:border-brand-400"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={run}
          disabled={busy || !csv.trim()}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? l.busy : l.run}
        </button>
        <button
          onClick={() => setCsv(SAMPLE)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
        >
          {l.sample}
        </button>
        {result && (
          <span className="text-xs">
            <span className="font-semibold text-emerald-600">{result.created}</span> {l.created}
            {result.skipped > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-amber-600">{result.skipped}</span> {l.skipped}
              </>
            )}
          </span>
        )}
      </div>
      {result && result.errors.length > 0 && (
        <ul className="mt-2 max-h-24 overflow-auto text-xs text-red-500">
          {result.errors.slice(0, 8).map((e, i) => (
            <li key={i}>• {e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
