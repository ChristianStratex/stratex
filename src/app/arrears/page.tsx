import Link from "next/link";
import { getI18n } from "@/i18n";
import { getArrears } from "@/lib/queries";
import { euro, formatDate } from "@/lib/format";
import { ChargeBadge } from "@/components/badges";
import { MarkPaidButton } from "@/components/ActionButtons";
import { getRole, can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

const BUCKET_COLORS: Record<string, string> = {
  "0-30": "bg-amber-100 text-amber-700",
  "31-60": "bg-orange-100 text-orange-700",
  "61-90": "bg-red-100 text-red-700",
  "90+": "bg-red-200 text-red-800",
};

export default async function ArrearsPage() {
  const { locale, t } = getI18n();
  const canPay = can("recordPayments", getRole());
  const rows = await getArrears();
  const total = rows.reduce((s, r) => s + r.outstanding, 0);

  const buckets = ["0-30", "31-60", "61-90", "90+"].map((b) => ({
    bucket: b,
    amount: rows.filter((r) => r.bucket === b).reduce((s, r) => s + r.outstanding, 0),
    count: rows.filter((r) => r.bucket === b).length,
  }));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{t.arrears.title}</h1>
        <p className="text-sm text-slate-500">{t.arrears.subtitle}</p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="card p-4">
          <div className="stat-label">{t.common.total}</div>
          <div className="stat-value mt-1 text-red-600">{euro(total, locale)}</div>
          <div className="mt-1 text-xs text-slate-400">
            {rows.length} {t.arrears.title.toLowerCase()}
          </div>
        </div>
        {buckets.map((b) => (
          <div key={b.bucket} className="card p-4">
            <div className="stat-label">{b.bucket} {locale === "nl" ? "dagen" : "days"}</div>
            <div className="stat-value mt-1">{euro(b.amount, locale, { compact: true })}</div>
            <div className="mt-1 text-xs text-slate-400">{b.count}×</div>
          </div>
        ))}
      </section>

      <div className="card overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-emerald-600">✓ {t.arrears.none}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">{t.arrears.tenant}</th>
                  <th className="th">{t.arrears.property}</th>
                  <th className="th">{t.arrears.period}</th>
                  <th className="th">{t.arrears.due}</th>
                  <th className="th text-right">{t.arrears.amount}</th>
                  <th className="th text-right">{t.arrears.daysLate}</th>
                  <th className="th text-center">{t.arrears.bucket}</th>
                  <th className="th">{t.arrears.status}</th>
                  <th className="th"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map((r) => (
                  <tr key={r.chargeId} className="hover:bg-slate-50">
                    <td className="td font-medium text-slate-800">{r.tenant}</td>
                    <td className="td">
                      <Link href={`/properties/${r.propertyId}`} className="text-brand-700 hover:underline">
                        {r.propertyName}
                      </Link>
                      <div className="text-xs text-slate-400">{r.city}</div>
                    </td>
                    <td className="td">{r.periodYm}</td>
                    <td className="td">{formatDate(r.dueDate, locale)}</td>
                    <td className="td text-right tabular-nums font-semibold text-red-600">{euro(r.outstanding, locale)}</td>
                    <td className="td text-right tabular-nums">{r.daysLate}</td>
                    <td className="td text-center">
                      <span className={`badge ${BUCKET_COLORS[r.bucket]}`}>{r.bucket}</span>
                    </td>
                    <td className="td">
                      <ChargeBadge status={r.status} locale={locale} />
                    </td>
                    <td className="td">
                      {canPay && <MarkPaidButton chargeId={r.chargeId} locale={locale} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
