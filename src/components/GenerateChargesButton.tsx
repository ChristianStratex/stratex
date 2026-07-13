"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateCharges } from "@/lib/actions";
import type { Locale } from "@/lib/enums";

export function GenerateChargesButton({ locale }: { locale: Locale }) {
  const nl = locale === "nl";
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="card flex flex-wrap items-center gap-3 p-4">
      <div className="text-sm">
        <div className="font-semibold text-slate-700">{nl ? "Huurposten deze maand" : "This month's rent charges"}</div>
        <div className="text-xs text-slate-400">
          {nl
            ? "Genereert ontbrekende huurposten voor alle actieve contracten (idempotent; draait later automatisch via cron)."
            : "Creates missing rent charges for all active leases (idempotent; runs via cron later)."}
        </div>
      </div>
      <button
        onClick={async () => {
          setBusy(true);
          setMsg(null);
          try {
            const r = await generateCharges();
            setMsg(
              nl
                ? `${r.periodYm}: ${r.created} aangemaakt, ${r.existing} bestonden al.`
                : `${r.periodYm}: ${r.created} created, ${r.existing} already existed.`,
            );
            router.refresh();
          } finally {
            setBusy(false);
          }
        }}
        disabled={busy}
        className="ml-auto rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {busy ? (nl ? "Bezig…" : "Working…") : nl ? "Genereer" : "Generate"}
      </button>
      {msg && <span className="w-full text-xs font-medium text-emerald-600">✓ {msg}</span>}
    </div>
  );
}
