import { getI18n } from "@/i18n";
import { getPortalData } from "@/lib/portal";
import { euro, formatDate } from "@/lib/format";
import { ChargeBadge, IssueStatusBadge } from "@/components/badges";
import { PortalIssueForm } from "@/components/PortalIssueForm";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const { locale, t } = getI18n();
  const nl = locale === "nl";
  const data = await getPortalData();

  if (!data) {
    return (
      <div className="card p-8 text-center text-sm text-slate-500">
        {nl ? "Geen huurdersgegevens gekoppeld aan dit account." : "No tenant data linked to this account."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">
          {nl ? "Welkom" : "Welcome"}, {data.tenantName}
        </h1>
        <p className="text-sm text-slate-500">
          {nl ? "Uw huurcontracten, betalingen en meldingen" : "Your leases, payments and issues"}
        </p>
      </header>

      {data.totalOutstanding > 0.01 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {nl ? "Openstaand bedrag" : "Outstanding amount"}:{" "}
          <span className="font-semibold">{euro(data.totalOutstanding, locale)}</span>
        </div>
      )}

      {data.leases.map((l) => (
        <section key={l.id} className="card p-4">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="font-semibold text-slate-900">{l.property}</h2>
              <p className="text-xs text-slate-400">
                {l.address} · {l.unit}
              </p>
            </div>
            <div className="text-right text-sm">
              <div className="font-semibold text-slate-900">{euro(l.monthlyRent, locale)}/{nl ? "mnd" : "mo"}</div>
              {l.endDate && (
                <div className="text-xs text-slate-400">
                  {nl ? "t/m" : "until"} {formatDate(l.endDate, locale)}
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr>
                  <th className="th">{nl ? "Periode" : "Period"}</th>
                  <th className="th text-right">{nl ? "Bedrag" : "Amount"}</th>
                  <th className="th text-right">{nl ? "Openstaand" : "Outstanding"}</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {l.charges.slice(0, 6).map((c) => (
                  <tr key={c.id}>
                    <td className="td">{c.periodYm}</td>
                    <td className="td text-right tabular-nums">{euro(c.amount, locale)}</td>
                    <td className={`td text-right tabular-nums ${c.outstanding > 0 ? "text-red-600" : "text-slate-400"}`}>
                      {c.outstanding > 0 ? euro(c.outstanding, locale) : "—"}
                    </td>
                    <td className="td">
                      <ChargeBadge status={c.status} locale={locale} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            {nl ? "Nieuwe melding" : "New issue"}
          </h2>
          <PortalIssueForm
            properties={data.leases.map((l) => ({ id: l.propertyId, name: l.property }))}
            locale={locale}
          />
        </section>

        <section className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">
            {nl ? "Uw meldingen" : "Your issues"} ({data.issues.length})
          </h2>
          {data.issues.length === 0 ? (
            <p className="text-sm text-slate-400">{nl ? "Geen meldingen." : "No issues."}</p>
          ) : (
            <ul className="divide-y divide-slate-50">
              {data.issues.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-2 py-2">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{i.title}</div>
                    <div className="text-xs text-slate-400">
                      {i.property.name} · {formatDate(i.createdAt, locale)}
                    </div>
                  </div>
                  <IssueStatusBadge status={i.status} locale={locale} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
