import { getI18n } from "@/i18n";
import { getPortfolio } from "@/lib/queries";
import { euro } from "@/lib/format";
import { PropertyExplorer } from "@/components/PropertyExplorer";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const { locale, t } = getI18n();
  const portfolio = await getPortfolio();

  const totalValue = portfolio.reduce((s, p) => s + (p.wozValue ?? 0), 0);
  const totalIncome = portfolio.reduce((s, p) => s + p.monthlyIncome, 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.nav.properties}</h1>
          <p className="text-sm text-slate-500">{t.dashboard.subtitle}</p>
        </div>
        <div className="flex items-center gap-4 text-right text-sm">
          <div>
            <div className="stat-label">{t.kpi.totalValue}</div>
            <div className="font-semibold text-slate-900">{euro(totalValue, locale, { compact: true })}</div>
          </div>
          <div>
            <div className="stat-label">{t.kpi.monthlyIncome}</div>
            <div className="font-semibold text-emerald-600">{euro(totalIncome, locale)}</div>
          </div>
          <a
            href="/api/export/properties"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            ↓ CSV
          </a>
        </div>
      </header>
      <PropertyExplorer rows={portfolio} t={t} locale={locale} />
    </div>
  );
}
