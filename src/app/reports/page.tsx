import { getI18n } from "@/i18n";
import { getEntityReport } from "@/lib/queries";
import { euro, percent } from "@/lib/format";
import { EntityBadge } from "@/components/badges";
import { getRole, can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { locale, t } = getI18n();
  const canExport = can("exportData", getRole());
  const rows = await getEntityReport();

  const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((s, r) => s + f(r), 0);
  const totWoz = sum((r) => r.totalWoz);
  const totIncome = sum((r) => r.monthlyIncome);
  const totCost = sum((r) => r.monthlyCost);
  const totNet = totIncome - totCost;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.reports.title}</h1>
          <p className="text-sm text-slate-500">{t.reports.subtitle}</p>
        </div>
        {canExport && (
          <a
            href="/api/export/entities"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            ↓ {t.reports.exportCsv}
          </a>
        )}
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">{t.reports.entity}</th>
                <th className="th">{t.reports.regime}</th>
                <th className="th text-center">{t.reports.properties}</th>
                <th className="th text-right">{t.reports.woz}</th>
                <th className="th text-right">{t.reports.income}</th>
                <th className="th text-right">{t.reports.cost}</th>
                <th className="th text-right">{t.reports.net}</th>
                <th className="th text-right">{t.reports.annual}</th>
                <th className="th text-right">{t.reports.yield}</th>
                <th className="th text-center">{t.reports.occupancy}</th>
                <th className="th text-right">{t.reports.arrears}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((r) => (
                <tr key={r.name} className="hover:bg-slate-50">
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <EntityBadge type={r.type} locale={locale} />
                      <div>
                        <div className="font-medium text-slate-800">{r.name}</div>
                        {r.kvkNumber && <div className="text-xs text-slate-400">KvK {r.kvkNumber}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <span className={`badge ${r.taxRegime === "BOX3" ? "bg-purple-100 text-purple-700" : "bg-brand-100 text-brand-700"}`}>
                      {r.taxRegime === "BOX3" ? "Box 3" : "Vpb"}
                    </span>
                  </td>
                  <td className="td text-center tabular-nums">{r.propertyCount}</td>
                  <td className="td text-right tabular-nums">{euro(r.totalWoz, locale, { compact: true })}</td>
                  <td className="td text-right tabular-nums">{euro(r.monthlyIncome, locale)}</td>
                  <td className="td text-right tabular-nums">{euro(r.monthlyCost, locale)}</td>
                  <td className={`td text-right tabular-nums ${r.netCashflow < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {euro(r.netCashflow, locale)}
                  </td>
                  <td className={`td text-right tabular-nums font-medium ${r.annualNet < 0 ? "text-red-600" : "text-slate-800"}`}>
                    {euro(r.annualNet, locale, { compact: true })}
                  </td>
                  <td className="td text-right tabular-nums">{percent(r.grossYield, locale)}</td>
                  <td className="td text-center tabular-nums">{Math.round(r.occupancy)}%</td>
                  <td className="td text-right tabular-nums">
                    {r.arrears > 0 ? <span className="text-red-600">{euro(r.arrears, locale)}</span> : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50">
              <tr>
                <td className="td font-semibold text-slate-900" colSpan={2}>
                  {t.reports.total}
                </td>
                <td className="td text-center font-semibold tabular-nums">{rows.reduce((s, r) => s + r.propertyCount, 0)}</td>
                <td className="td text-right font-semibold tabular-nums">{euro(totWoz, locale, { compact: true })}</td>
                <td className="td text-right font-semibold tabular-nums">{euro(totIncome, locale)}</td>
                <td className="td text-right font-semibold tabular-nums">{euro(totCost, locale)}</td>
                <td className={`td text-right font-semibold tabular-nums ${totNet < 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {euro(totNet, locale)}
                </td>
                <td className="td text-right font-semibold tabular-nums">{euro(totNet * 12, locale, { compact: true })}</td>
                <td className="td text-right font-semibold tabular-nums">
                  {percent(totWoz > 0 ? (totIncome * 12) / totWoz * 100 : null, locale)}
                </td>
                <td className="td" colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        {locale === "nl"
          ? "Box 3-entiteiten (privé) vs. Vpb-entiteiten (B.V./holding) — vergelijk structuren in de fiscale module."
          : "Box 3 entities (personal) vs. Vpb entities (BV/holding) — compare structures in the tax module."}
      </p>
    </div>
  );
}
