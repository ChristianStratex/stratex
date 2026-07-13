"use client";

import { useState } from "react";
import { upsertEntity, deleteEntity } from "@/lib/admin-actions";
import { ENTITY_TYPES, ENTITY_TYPE_LABELS, label, type Locale } from "@/lib/enums";

export interface EntityRow {
  id: string;
  name: string;
  type: string;
  kvkNumber: string | null;
  taxRegime: string;
  propertyCount: number;
}

export function AdminEntities({ entities, locale }: { entities: EntityRow[]; locale: Locale }) {
  const nl = locale === "nl";
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <section className="card p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">{nl ? "Entiteiten" : "Legal entities"}</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">{nl ? "Naam" : "Name"}</th>
              <th className="th">{nl ? "Type" : "Type"}</th>
              <th className="th">KvK</th>
              <th className="th">Regime</th>
              <th className="th text-center">{nl ? "Panden" : "Properties"}</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {entities.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="td font-medium text-slate-800">{e.name}</td>
                <td className="td">{label(ENTITY_TYPE_LABELS, e.type, locale)}</td>
                <td className="td text-slate-500">{e.kvkNumber ?? "—"}</td>
                <td className="td">{e.taxRegime === "BOX3" ? "Box 3" : "Vpb"}</td>
                <td className="td text-center tabular-nums">{e.propertyCount}</td>
                <td className="td">
                  {e.propertyCount === 0 && (
                    <form
                      action={async (fd) => {
                        const res = await deleteEntity(fd);
                        if (res.error) setMsg(nl ? "Kan niet verwijderen." : "Cannot delete.");
                      }}
                    >
                      <input type="hidden" name="id" value={e.id} />
                      <button type="submit" className="text-xs text-slate-400 hover:text-red-600">✕</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        action={async (fd) => {
          const res = await upsertEntity(fd);
          setMsg(res.error ? (nl ? "Naam verplicht." : "Name required.") : nl ? "Entiteit opgeslagen." : "Entity saved.");
        }}
        className="mt-4 grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-4"
      >
        <input name="name" required placeholder={nl ? "Naam" : "Name"} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
        <select name="type" className="rounded-md border border-slate-200 px-2 py-1.5 text-sm">
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>{label(ENTITY_TYPE_LABELS, t, locale)}</option>
          ))}
        </select>
        <input name="kvkNumber" placeholder="KvK" className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
        <button type="submit" className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700">
          {nl ? "Toevoegen" : "Add"}
        </button>
        {msg && <span className="col-span-2 text-xs text-slate-500 sm:col-span-4">{msg}</span>}
      </form>
    </section>
  );
}
