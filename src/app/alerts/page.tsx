import Link from "next/link";
import { getI18n } from "@/i18n";
import { getAlerts, type AlertSeverity } from "@/lib/alerts";
import { euro, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const SEVERITY_STYLE: Record<AlertSeverity, string> = {
  CRITICAL: "bg-red-600 text-white",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW: "bg-slate-100 text-slate-600",
};

const KIND_ICON: Record<string, string> = {
  ARREARS: "⚠",
  VACANT: "🏚",
  EXPIRING: "⏳",
  INDEXATION: "📈",
  ISSUE: "🔧",
};

export default async function AlertsPage() {
  const { locale, t } = getI18n();
  const alerts = await getAlerts();

  const counts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<AlertSeverity, number>;
  for (const a of alerts) counts[a.severity]++;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{t.alerts.title}</h1>
        <p className="text-sm text-slate-500">{t.alerts.subtitle}</p>
      </header>

      <section className="grid grid-cols-4 gap-3">
        {(Object.keys(counts) as AlertSeverity[]).map((s) => (
          <div key={s} className="card p-4">
            <div className="stat-label">{t.alerts.severities[s]}</div>
            <div className={`stat-value mt-1 ${s === "CRITICAL" && counts[s] > 0 ? "text-red-600" : ""}`}>
              {counts[s]}
            </div>
          </div>
        ))}
      </section>

      {alerts.length === 0 ? (
        <div className="card p-6 text-center text-sm text-emerald-600">✓ {t.alerts.none}</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">{t.alerts.severity}</th>
                  <th className="th">{t.alerts.kind}</th>
                  <th className="th">{t.alerts.where}</th>
                  <th className="th">{t.alerts.what}</th>
                  <th className="th text-right">€ / datum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {alerts.map((a, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="td">
                      <span className={`badge ${SEVERITY_STYLE[a.severity]}`}>{t.alerts.severities[a.severity]}</span>
                    </td>
                    <td className="td">
                      <span className="mr-1">{KIND_ICON[a.kind]}</span>
                      {t.alerts.kinds[a.kind]}
                    </td>
                    <td className="td">
                      <Link href={a.href} className="font-medium text-brand-700 hover:underline">
                        {a.title}
                      </Link>
                    </td>
                    <td className="td text-slate-600">{a.detail}</td>
                    <td className="td text-right tabular-nums">
                      {a.amount != null ? euro(a.amount, locale) : a.date ? formatDate(a.date, locale) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
