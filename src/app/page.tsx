import { getI18n } from "@/i18n";
import { getKpis, getPortfolio, getInsights, getCollectionTrend } from "@/lib/queries";
import { euro, percent } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import { MapPanel } from "@/components/MapPanel";
import { DonutChart, CollectionChart } from "@/components/Charts";
import { PropertyTable } from "@/components/PropertyTable";
import { Insights } from "@/components/Insights";
import { label, PROPERTY_TYPE_LABELS } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { locale, t } = getI18n();
  const [kpis, portfolio, insights, collection] = await Promise.all([
    getKpis(),
    getPortfolio(),
    getInsights(),
    getCollectionTrend(),
  ]);

  const mapPoints = portfolio
    .filter((p) => p.latitude && p.longitude)
    .map((p) => ({
      id: p.id,
      name: p.name,
      city: p.city,
      lat: p.latitude!,
      lng: p.longitude!,
      health: p.health,
      income: euro(p.monthlyIncome, locale, { compact: true }),
      woz: euro(p.wozValue, locale, { compact: true }),
    }));

  const entitySlices = kpis.byEntity.map((e) => ({ name: e.name, value: Math.round(e.value) }));
  const typeSlices = kpis.byType.map((tp) => ({
    name: label(PROPERTY_TYPE_LABELS, tp.type, locale),
    value: tp.count,
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{t.dashboard.title}</h1>
        <p className="text-sm text-slate-500">{t.dashboard.subtitle}</p>
      </header>

      {/* KPI grid */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label={t.kpi.totalValue} value={euro(kpis.totalValue, locale, { compact: true })} sub={`${kpis.propertyCount} ${t.kpi.properties.toLowerCase()}`} />
        <KpiCard label={t.kpi.monthlyIncome} value={euro(kpis.monthlyIncome, locale)} tone="positive" sub={`${percent(kpis.grossYield, locale)} ${t.kpi.grossYield.toLowerCase()}`} />
        <KpiCard label={t.kpi.monthlyCost} value={euro(kpis.monthlyCost, locale)} />
        <KpiCard label={t.kpi.netCashflow} value={euro(kpis.netCashflow, locale)} tone={kpis.netCashflow >= 0 ? "positive" : "negative"} />
        <KpiCard label={t.kpi.arrears} value={euro(kpis.totalArrears, locale)} tone={kpis.totalArrears > 0 ? "negative" : "positive"} href="/arrears" />
        <KpiCard label={t.kpi.occupancy} value={`${Math.round(kpis.occupancy)}%`} tone={kpis.occupancy >= 90 ? "positive" : "warning"} />
        <KpiCard label={t.kpi.openIssues} value={String(kpis.openIssues)} tone={kpis.openIssues > 0 ? "warning" : "positive"} href="/issues" />
        <KpiCard label={t.kpi.expiringSoon} value={String(kpis.expiringSoon)} tone={kpis.expiringSoon > 0 ? "warning" : "default"} sub="≤ 6 mnd" />
      </section>

      {/* Actions & opportunities */}
      <Insights data={insights} t={t} locale={locale} />

      {/* Map + breakdowns */}
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-2 text-sm font-semibold text-slate-700">{t.dashboard.map}</div>
          <MapPanel points={mapPoints} />
        </div>
        <div className="space-y-4">
          <div className="card p-4">
            <div className="mb-1 text-sm font-semibold text-slate-700">{t.dashboard.byEntity}</div>
            <DonutChart data={entitySlices} valuePrefix="€ " />
          </div>
          <div className="card p-4">
            <div className="mb-1 text-sm font-semibold text-slate-700">{t.dashboard.byType}</div>
            <DonutChart data={typeSlices} />
          </div>
        </div>
      </section>

      {/* Collection trend */}
      <section className="card p-4">
        <div className="mb-1 text-sm font-semibold text-slate-700">{t.dashboard.collection}</div>
        <CollectionChart data={collection} expectedLabel={t.dashboard.expected} collectedLabel={t.dashboard.collected} />
      </section>

      {/* All properties */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">{t.dashboard.allProperties}</h2>
          <span className="text-xs text-slate-400">
            {portfolio.length} {t.kpi.properties.toLowerCase()}
          </span>
        </div>
        <PropertyTable rows={portfolio} t={t} locale={locale} />
      </section>
    </div>
  );
}
