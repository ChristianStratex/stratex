"use client";

import { useState } from "react";
import { createLease, endLease } from "@/lib/lease-actions";
import type { Locale } from "@/lib/enums";

export interface VacantUnit {
  id: string;
  label: string;
}
export interface ActiveLeaseRow {
  id: string;
  unit: string;
  tenant: string;
}

export function LeaseManager({
  propertyId,
  vacantUnits,
  activeLeases,
  tenants,
  locale,
}: {
  propertyId: string;
  vacantUnits: VacantUnit[];
  activeLeases: ActiveLeaseRow[];
  tenants: { id: string; name: string }[];
  locale: Locale;
}) {
  const nl = locale === "nl";
  const [open, setOpen] = useState(false);
  const [newTenant, setNewTenant] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">{nl ? "Contractbeheer" : "Lease management"}</h2>
        {vacantUnits.length > 0 && (
          <button onClick={() => setOpen((o) => !o)} className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100">
            {nl ? "+ Nieuw contract" : "+ New lease"}
          </button>
        )}
      </div>

      {activeLeases.length > 0 && (
        <ul className="mb-3 divide-y divide-slate-50 text-sm">
          {activeLeases.map((l) => (
            <li key={l.id} className="flex items-center justify-between py-1.5">
              <span className="text-slate-700">
                {l.unit} — <span className="font-medium">{l.tenant}</span>
              </span>
              <form action={endLease}>
                <input type="hidden" name="id" value={l.id} />
                <button type="submit" className="text-xs text-slate-400 hover:text-red-600">
                  {nl ? "Beëindigen" : "End"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {vacantUnits.length === 0 && activeLeases.length > 0 && (
        <p className="text-xs text-slate-400">{nl ? "Geen leegstaande units." : "No vacant units."}</p>
      )}

      {open && vacantUnits.length > 0 && (
        <form
          action={async (fd) => {
            const res = await createLease(fd);
            if (res.error) {
              setMsg(
                res.error === "occupied"
                  ? nl ? "Unit is al verhuurd." : "Unit already leased."
                  : res.error === "tenant_required"
                    ? nl ? "Kies of vul een huurder in." : "Choose or enter a tenant."
                    : nl ? "Controleer de velden." : "Check the fields.",
              );
            } else {
              setMsg(nl ? "Contract aangemaakt." : "Lease created.");
              setOpen(false);
            }
          }}
          className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <input type="hidden" name="propertyId" value={propertyId} />
          <div className="grid grid-cols-2 gap-2">
            <select name="unitId" required className="rounded-md border border-slate-200 px-2 py-1.5 text-sm">
              {vacantUnits.map((u) => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-xs text-slate-600">
              <input type="checkbox" checked={newTenant} onChange={(e) => setNewTenant(e.target.checked)} />
              {nl ? "Nieuwe huurder" : "New tenant"}
            </label>
          </div>
          {newTenant ? (
            <input name="newTenant" required placeholder={nl ? "Naam nieuwe huurder" : "New tenant name"} className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
          ) : (
            <select name="tenantId" className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-sm">
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          <div className="grid grid-cols-2 gap-2">
            <input name="monthlyRent" type="number" min="1" step="any" required placeholder={nl ? "Maandhuur €" : "Monthly rent €"} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
            <input name="serviceCharge" type="number" min="0" step="any" placeholder={nl ? "Servicekosten €" : "Service charge €"} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
            <input name="startDate" type="date" required className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
            <input name="endDate" type="date" className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
          </div>
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input type="checkbox" name="indexationClause" defaultChecked /> {nl ? "Jaarlijkse CPI-indexatie" : "Annual CPI indexation"}
          </label>
          <button type="submit" className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
            {nl ? "Opslaan" : "Save"}
          </button>
        </form>
      )}
      {msg && <p className="mt-2 text-xs text-slate-500">{msg}</p>}
    </section>
  );
}
