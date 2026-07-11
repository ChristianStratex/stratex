import Link from "next/link";
import { notFound } from "next/navigation";
import { getI18n } from "@/i18n";
import { getPropertyDetail } from "@/lib/queries";
import { euro, percent, formatDate } from "@/lib/format";
import { ValuationChart } from "@/components/Charts";
import {
  ChargeBadge,
  IssueStatusBadge,
  PriorityBadge,
  TypeBadge,
  PropertyStatusBadge,
  EntityBadge,
} from "@/components/badges";
import {
  label,
  ISSUE_CATEGORY_LABELS,
  ISSUE_RAISED_BY_LABELS,
} from "@/lib/enums";
import { NewIssueForm } from "@/components/NewIssueForm";
import { MarkPaidButton, IssueStatusButtons } from "@/components/ActionButtons";

export const dynamic = "force-dynamic";

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const { locale, t } = getI18n();
  const detail = await getPropertyDetail(params.id);
  if (!detail) notFound();
  const { property: p, stats, charges } = detail;

  const activeLeases = p.units.flatMap((u) =>
    u.leases.filter((l) => l.status === "ACTIVE").map((l) => ({ ...l, unitLabel: u.label })),
  );
  const openIssues = p.issues.filter((i) => i.status !== "RESOLVED");
  const lateCharges = charges.filter((c) => c.status === "LATE" || c.status === "MISSING" || c.status === "PARTIAL");
  const valuationData = p.valuations.map((v) => ({
    label: formatDate(v.date, locale),
    value: v.value,
  }));

  const statItems = [
    { label: t.property.wozValue, value: euro(p.wozValue, locale) },
    { label: t.property.purchasePrice, value: euro(p.purchasePrice, locale) },
    { label: t.property.monthlyIncome, value: euro(stats.monthlyIncome, locale), tone: "text-emerald-600" },
    { label: t.property.monthlyCost, value: euro(stats.monthlyCost, locale) },
    {
      label: t.property.netCashflow,
      value: euro(stats.netCashflow, locale),
      tone: stats.netCashflow >= 0 ? "text-emerald-600" : "text-red-600",
    },
    { label: t.property.yield, value: percent(stats.grossYield, locale) },
    { label: t.property.occupancy, value: `${Math.round(stats.occupancy)}%` },
    { label: t.property.nextIndexation, value: formatDate(stats.nextIndexation, locale) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-xs text-slate-400 hover:text-brand-600">
          ← {t.property.backToDashboard}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{p.name}</h1>
          <TypeBadge type={p.type} locale={locale} />
          <PropertyStatusBadge status={p.status} locale={locale} />
        </div>
        <p className="text-sm text-slate-500">
          {p.street}, {p.postalCode} {p.city}
          {p.kadasterRef ? ` · Kadaster ${p.kadasterRef}` : ""}
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="text-slate-500">{t.property.owner}:</span>
          <EntityBadge type={p.ownerEntity.type} locale={locale} />
          <span className="text-slate-600">{p.ownerEntity.name}</span>
        </div>
      </div>

      {/* Stat grid */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statItems.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="stat-label">{s.label}</div>
            <div className={`mt-1 text-xl font-semibold ${s.tone ?? "text-slate-900"}`}>{s.value}</div>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: leases + payments */}
        <div className="space-y-6 lg:col-span-2">
          {/* Leases */}
          <section className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">
              {t.property.leases} ({activeLeases.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr>
                    <th className="th">{t.property.units}</th>
                    <th className="th">{t.property.tenant}</th>
                    <th className="th text-right">{t.property.rent}</th>
                    <th className="th text-right">{t.property.leaseEnd}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activeLeases.map((l) => (
                    <tr key={l.id}>
                      <td className="td">{l.unitLabel}</td>
                      <td className="td font-medium text-slate-800">{l.tenant.name}</td>
                      <td className="td text-right tabular-nums">{euro(l.monthlyRent + l.serviceCharge, locale)}</td>
                      <td className="td text-right">{formatDate(l.endDate, locale)}</td>
                    </tr>
                  ))}
                  {activeLeases.length === 0 && (
                    <tr>
                      <td className="td text-slate-400" colSpan={4}>
                        —
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Late payments */}
          <section className="card p-4">
            <h2 className="mb-3 text-sm font-semibold text-slate-700">{t.property.latePayments}</h2>
            {lateCharges.length === 0 ? (
              <p className="text-sm text-emerald-600">✓ {t.arrears.none}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr>
                      <th className="th">{t.arrears.tenant}</th>
                      <th className="th">{t.arrears.period}</th>
                      <th className="th text-right">{t.arrears.amount}</th>
                      <th className="th text-right">{t.arrears.daysLate}</th>
                      <th className="th">{t.arrears.status}</th>
                      <th className="th"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {lateCharges.map((c) => (
                      <tr key={c.id}>
                        <td className="td font-medium text-slate-800">{c.tenant}</td>
                        <td className="td">{c.periodYm}</td>
                        <td className="td text-right tabular-nums text-red-600">{euro(c.outstanding, locale)}</td>
                        <td className="td text-right tabular-nums">{c.daysLate}</td>
                        <td className="td">
                          <ChargeBadge status={c.status} locale={locale} />
                        </td>
                        <td className="td">
                          <MarkPaidButton chargeId={c.id} locale={locale} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Issues */}
          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700">
                {t.property.openIssues} ({openIssues.length})
              </h2>
              <NewIssueForm propertyId={p.id} locale={locale} />
            </div>
            {openIssues.length === 0 ? (
              <p className="text-sm text-slate-400">{t.issues.none}</p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {openIssues.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-2 py-2">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{i.title}</div>
                      <div className="text-xs text-slate-400">
                        {label(ISSUE_CATEGORY_LABELS, i.category, locale)} ·{" "}
                        {label(ISSUE_RAISED_BY_LABELS, i.raisedBy, locale)}
                        {i.cost ? ` · ${euro(i.cost, locale)}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={i.priority} locale={locale} />
                      <IssueStatusBadge status={i.status} locale={locale} />
                      <IssueStatusButtons id={i.id} status={i.status} locale={locale} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right: valuation + mortgage */}
        <div className="space-y-6">
          <section className="card p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-700">{t.property.wozValue}</h2>
            <ValuationChart data={valuationData} />
          </section>

          {p.mortgages.length > 0 && (
            <section className="card p-4">
              <h2 className="mb-3 text-sm font-semibold text-slate-700">{t.property.mortgage}</h2>
              {p.mortgages.map((m) => (
                <div key={m.id} className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{m.lender}</span>
                    <span className="font-medium">{euro(m.principal, locale, { compact: true })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rente</span>
                    <span>{m.interestRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t.common.perMonth}</span>
                    <span className="text-red-600">{euro(m.monthlyPayment, locale)}</span>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
