"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { PropertyStats } from "@/lib/queries";
import type { Dictionary } from "@/i18n/dictionaries";
import { type Locale, PROPERTY_TYPES, label, PROPERTY_TYPE_LABELS } from "@/lib/enums";
import { euro, percent } from "@/lib/format";
import { HealthDot, TypeBadge, EntityBadge } from "./badges";

type SortKey = "name" | "wozValue" | "monthlyIncome" | "netCashflow" | "grossYield" | "arrearsAmount";

export function PropertyExplorer({ rows, t, locale }: { rows: PropertyStats[]; t: Dictionary; locale: Locale }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [entityFilter, setEntityFilter] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("wozValue");
  const [asc, setAsc] = useState(false);

  const entities = useMemo(() => [...new Set(rows.map((r) => r.ownerName))].sort(), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows.filter((r) => {
      if (typeFilter && r.type !== typeFilter) return false;
      if (entityFilter && r.ownerName !== entityFilter) return false;
      if (q && !(`${r.name} ${r.street} ${r.city}`.toLowerCase().includes(q))) return false;
      return true;
    });
    out = [...out].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === "string" && typeof bv === "string") return asc ? av.localeCompare(bv) : bv.localeCompare(av);
      return asc ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return out;
  }, [rows, query, typeFilter, entityFilter, sortKey, asc]);

  const totalIncome = filtered.reduce((s, p) => s + p.monthlyIncome, 0);
  const totalValue = filtered.reduce((s, p) => s + (p.wozValue ?? 0), 0);

  const sortableHeader = (key: SortKey, text: string, align: "left" | "right" | "center" = "left") => (
    <th
      className={`th cursor-pointer select-none hover:text-slate-700 ${align === "right" ? "text-right" : align === "center" ? "text-center" : ""}`}
      onClick={() => {
        if (sortKey === key) setAsc(!asc);
        else {
          setSortKey(key);
          setAsc(false);
        }
      }}
    >
      {text}
      {sortKey === key ? (asc ? " ▲" : " ▼") : ""}
    </th>
  );

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={locale === "nl" ? "Zoek op naam, straat of plaats…" : "Search name, street or city…"}
          className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-400"
        />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
          <option value="">{locale === "nl" ? "Alle types" : "All types"}</option>
          {PROPERTY_TYPES.map((tp) => (
            <option key={tp} value={tp}>{label(PROPERTY_TYPE_LABELS, tp, locale)}</option>
          ))}
        </select>
        <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
          <option value="">{locale === "nl" ? "Alle entiteiten" : "All entities"}</option>
          {entities.map((en) => (
            <option key={en} value={en}>{en}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-slate-400">
          {filtered.length} {t.kpi.properties.toLowerCase()} · {euro(totalValue, locale, { compact: true })} · {euro(totalIncome, locale)}/mnd
        </span>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">{t.dashboard.health}</th>
                {sortableHeader("name", t.property.name)}
                <th className="th">{t.property.owner}</th>
                <th className="th">{t.property.type}</th>
                {sortableHeader("wozValue", t.property.wozValue, "right")}
                {sortableHeader("monthlyIncome", t.property.monthlyIncome, "right")}
                {sortableHeader("netCashflow", t.property.netCashflow, "right")}
                {sortableHeader("grossYield", t.property.yield, "right")}
                <th className="th text-center">{t.property.occupancy}</th>
                {sortableHeader("arrearsAmount", t.property.latePayments, "center")}
                <th className="th text-center">{t.property.openIssues}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50">
                  <td className="td text-center"><HealthDot health={p.health} /></td>
                  <td className="td">
                    <Link href={`/properties/${p.id}`} className="font-medium text-slate-900 group-hover:text-brand-700">
                      {p.name}
                    </Link>
                    <div className="text-xs text-slate-400">{p.street}, {p.city}</div>
                  </td>
                  <td className="td">
                    <EntityBadge type={p.ownerType} locale={locale} />
                    <div className="mt-0.5 text-xs text-slate-400">{p.ownerName}</div>
                  </td>
                  <td className="td"><TypeBadge type={p.type} locale={locale} /></td>
                  <td className="td text-right tabular-nums">{euro(p.wozValue, locale)}</td>
                  <td className="td text-right tabular-nums">{euro(p.monthlyIncome, locale)}</td>
                  <td className={`td text-right tabular-nums ${p.netCashflow < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {euro(p.netCashflow, locale)}
                  </td>
                  <td className="td text-right tabular-nums">{percent(p.grossYield, locale)}</td>
                  <td className="td text-center tabular-nums">{Math.round(p.occupancy)}%</td>
                  <td className="td text-center">
                    {p.arrearsCount > 0 ? (
                      <span className="badge bg-red-100 text-red-700">{euro(p.arrearsAmount, locale, { compact: true })}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="td text-center">
                    {p.openIssues > 0 ? (
                      <span className="badge bg-amber-100 text-amber-700">{p.openIssues}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="td py-6 text-center text-slate-400" colSpan={11}>
                    {locale === "nl" ? "Geen panden gevonden." : "No properties found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
