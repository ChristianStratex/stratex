import Link from "next/link";
import type { PropertyStats } from "@/lib/queries";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/lib/enums";
import { euro, percent } from "@/lib/format";
import { HealthDot, TypeBadge, EntityBadge } from "./badges";

export function PropertyTable({
  rows,
  t,
  locale,
}: {
  rows: PropertyStats[];
  t: Dictionary;
  locale: Locale;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">{t.dashboard.health}</th>
              <th className="th">{t.property.name}</th>
              <th className="th">{t.property.owner}</th>
              <th className="th">{t.property.type}</th>
              <th className="th text-right">{t.property.wozValue}</th>
              <th className="th text-right">{t.property.monthlyIncome}</th>
              <th className="th text-right">{t.property.netCashflow}</th>
              <th className="th text-right">{t.property.yield}</th>
              <th className="th text-center">{t.property.occupancy}</th>
              <th className="th text-center">{t.property.latePayments}</th>
              <th className="th text-center">{t.property.openIssues}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rows.map((p) => (
              <tr key={p.id} className="group hover:bg-slate-50">
                <td className="td text-center">
                  <HealthDot health={p.health} />
                </td>
                <td className="td">
                  <Link href={`/properties/${p.id}`} className="font-medium text-slate-900 group-hover:text-brand-700">
                    {p.name}
                  </Link>
                  <div className="text-xs text-slate-400">
                    {p.street}, {p.city}
                  </div>
                </td>
                <td className="td">
                  <EntityBadge type={p.ownerType} locale={locale} />
                  <div className="mt-0.5 text-xs text-slate-400">{p.ownerName}</div>
                </td>
                <td className="td">
                  <TypeBadge type={p.type} locale={locale} />
                </td>
                <td className="td text-right tabular-nums">{euro(p.wozValue, locale)}</td>
                <td className="td text-right tabular-nums">{euro(p.monthlyIncome, locale)}</td>
                <td className={`td text-right tabular-nums ${p.netCashflow < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {euro(p.netCashflow, locale)}
                </td>
                <td className="td text-right tabular-nums">{percent(p.grossYield, locale)}</td>
                <td className="td text-center tabular-nums">
                  {Math.round(p.occupancy)}%
                </td>
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
          </tbody>
        </table>
      </div>
    </div>
  );
}
