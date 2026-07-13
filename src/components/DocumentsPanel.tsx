"use client";

import { useRef, useState } from "react";
import { uploadDocument, deleteDocument } from "@/lib/document-actions";
import type { Locale } from "@/lib/enums";

export interface DocRow {
  id: string;
  name: string;
  kind: string;
  size: number;
  createdAt: string; // ISO
  uploadedBy: string | null;
}

const KIND_LABELS: Record<string, { nl: string; en: string }> = {
  LEASE: { nl: "Huurcontract", en: "Lease" },
  DEED: { nl: "Akte", en: "Deed" },
  PERMIT: { nl: "Vergunning", en: "Permit" },
  INVOICE: { nl: "Factuur", en: "Invoice" },
  OTHER: { nl: "Overig", en: "Other" },
};

function fmtSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} kB`;
}

export function DocumentsPanel({
  propertyId,
  docs,
  canEdit,
  locale,
}: {
  propertyId: string;
  docs: DocRow[];
  canEdit: boolean;
  locale: Locale;
}) {
  const nl = locale === "nl";
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="card p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">
        {nl ? "Documenten" : "Documents"} ({docs.length})
      </h2>

      {docs.length === 0 ? (
        <p className="text-sm text-slate-400">{nl ? "Nog geen documenten." : "No documents yet."}</p>
      ) : (
        <ul className="divide-y divide-slate-50">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 py-2">
              <div className="min-w-0">
                <a href={`/api/documents/${d.id}`} className="truncate text-sm font-medium text-brand-700 hover:underline">
                  {d.name}
                </a>
                <div className="text-xs text-slate-400">
                  {KIND_LABELS[d.kind]?.[locale] ?? d.kind} · {fmtSize(d.size)}
                  {d.uploadedBy ? ` · ${d.uploadedBy}` : ""}
                </div>
              </div>
              {canEdit && (
                <form action={deleteDocument}>
                  <input type="hidden" name="id" value={d.id} />
                  <button type="submit" className="text-xs text-slate-400 hover:text-red-600" title={nl ? "Verwijderen" : "Delete"}>
                    ✕
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <form
          ref={formRef}
          action={async (fd) => {
            setBusy(true);
            setError(null);
            try {
              const res = await uploadDocument(fd);
              if (res.error) setError(res.error);
              else formRef.current?.reset();
            } finally {
              setBusy(false);
            }
          }}
          className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"
        >
          <input type="hidden" name="propertyId" value={propertyId} />
          <input type="file" name="file" required className="text-xs" />
          <select name="kind" className="rounded-md border border-slate-200 px-2 py-1 text-xs">
            {Object.entries(KIND_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v[locale]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? (nl ? "Bezig…" : "Uploading…") : nl ? "Upload" : "Upload"}
          </button>
          {error && (
            <span className="text-xs text-red-600">
              {error === "too_large" ? (nl ? "Max 10 MB." : "Max 10 MB.") : nl ? "Upload mislukt." : "Upload failed."}
            </span>
          )}
        </form>
      )}
    </section>
  );
}
