import { getI18n } from "@/i18n";
import { TaxCalculator } from "@/components/TaxCalculator";

export default function TaxPage() {
  const { locale, t } = getI18n();
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{t.tax.title}</h1>
        <p className="text-sm text-slate-500">{t.tax.subtitle}</p>
      </header>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
        {t.tax.disclaimer}
      </div>

      <TaxCalculator locale={locale} />

      <div className="card p-5 text-sm text-slate-600">
        <h2 className="mb-2 font-semibold text-slate-800">
          {locale === "nl" ? "Waarom dit ertoe doet" : "Why this matters"}
        </h2>
        <p className="mb-2">
          {locale === "nl"
            ? "Privébezit valt in Box 3 (nu een forfaitair rendement). Vanaf 2028 (voorgesteld) wordt de werkelijke huur belast plus vermogenswinst bij verkoop, wat privébezit voor renderende portefeuilles duurder maakt. Een B.V. betaalt vennootschapsbelasting (19% / 25,8%) en pas bij uitkering Box 2 (24,5% / 31%) — het voordeel zit in uitstel en aftrekbaarheid."
            : "Personal ownership sits in Box 3 (currently a fictional return). From 2028 (proposed) actual rent is taxed plus capital gains at sale, making personal ownership costlier for performing portfolios. A BV pays corporate tax (19% / 25.8%) and only Box 2 (24.5% / 31%) on distribution — the advantage is deferral and deductibility."}
        </p>
        <p className="text-xs text-slate-400">
          {locale === "nl"
            ? "Tarieven zijn instelbaar in code (src/lib/tax.ts) en volgen de stand 2026. De wetgeving rond Box 3 (Wet werkelijk rendement) is nog niet definitief."
            : "Rates are configurable in code (src/lib/tax.ts) and reflect 2026 figures. The Box 3 reform (Wet werkelijk rendement) is not yet final."}
        </p>
      </div>
    </div>
  );
}
