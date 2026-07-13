"use client";

import { useRef, useState } from "react";
import { createTenantIssue } from "@/lib/portal-actions";
import type { Locale } from "@/lib/enums";

export function PortalIssueForm({
  properties,
  locale,
}: {
  properties: { id: string; name: string }[];
  locale: Locale;
}) {
  const nl = locale === "nl";
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        setBusy(true);
        setMsg(null);
        try {
          const res = await createTenantIssue(fd);
          if (res.error) setMsg(nl ? "Melding mislukt." : "Failed to submit.");
          else {
            setMsg(nl ? "Melding ontvangen — de beheerder pakt dit op." : "Issue received — the manager will follow up.");
            formRef.current?.reset();
          }
        } finally {
          setBusy(false);
        }
      }}
      className="space-y-2"
    >
      <select name="propertyId" required className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <input
        name="title"
        required
        placeholder={nl ? "Wat is er aan de hand?" : "What's wrong?"}
        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
      />
      <textarea
        name="description"
        rows={3}
        placeholder={nl ? "Omschrijving (optioneel)" : "Description (optional)"}
        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? (nl ? "Bezig…" : "Sending…") : nl ? "Melding indienen" : "Submit issue"}
        </button>
        {msg && <span className="text-xs text-emerald-600">{msg}</span>}
      </div>
    </form>
  );
}
