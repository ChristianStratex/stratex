import Link from "next/link";
import { getI18n } from "@/i18n";
import { getTenants } from "@/lib/queries";
import { euro, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TenantsPage() {
  const { locale, t } = getI18n();
  const tenants = await getTenants();
  const totalRent = tenants.reduce((s, tn) => s + tn.monthlyRent, 0);
  const withArrears = tenants.filter((tn) => tn.arrears > 0).length;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{t.tenants.title}</h1>
        <p className="text-sm text-slate-500">{t.tenants.subtitle}</p>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="stat-label">{t.tenants.title}</div>
          <div className="stat-value mt-1">{tenants.length}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">{t.tenants.rent}</div>
          <div className="stat-value mt-1 text-emerald-600">{euro(totalRent, locale)}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">{t.tenants.arrears}</div>
          <div className={`stat-value mt-1 ${withArrears > 0 ? "text-red-600" : ""}`}>{withArrears}</div>
        </div>
      </section>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">{t.tenants.name}</th>
                <th className="th">{t.tenants.contact}</th>
                <th className="th text-center">{t.tenants.leases}</th>
                <th className="th">{t.tenants.properties}</th>
                <th className="th text-right">{t.tenants.rent}</th>
                <th className="th text-right">{t.tenants.arrears}</th>
                <th className="th">{t.tenants.nextEnd}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tenants.map((tn) => (
                <tr key={tn.id} className="hover:bg-slate-50">
                  <td className="td font-medium text-slate-800">{tn.name}</td>
                  <td className="td text-xs text-slate-500">{tn.email ?? tn.contact ?? "—"}</td>
                  <td className="td text-center tabular-nums">{tn.leaseCount}</td>
                  <td className="td text-xs text-slate-500">{tn.properties.join(", ")}</td>
                  <td className="td text-right tabular-nums">{euro(tn.monthlyRent, locale)}</td>
                  <td className="td text-right tabular-nums">
                    {tn.arrears > 0 ? <span className="text-red-600">{euro(tn.arrears, locale)}</span> : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="td">{formatDate(tn.nextEnd, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
