import Link from "next/link";
import type { Insight } from "@/lib/queries";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/lib/enums";
import { euro, formatDate } from "@/lib/format";

interface Props {
  data: { expiring: Insight[]; vacant: Insight[]; indexation: Insight[]; arrears: Insight[] };
  t: Dictionary;
  locale: Locale;
}

const META = {
  EXPIRING: { icon: "⏳", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  VACANT: { icon: "🏚", color: "text-red-600", bg: "bg-red-50 border-red-200" },
  INDEXATION: { icon: "📈", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  ARREARS: { icon: "⚠", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
} as const;

function Group({ title, items, kind, t, locale }: { title: string; items: Insight[]; kind: keyof typeof META; t: Dictionary; locale: Locale }) {
  if (items.length === 0) return null;
  const m = META[kind];
  return (
    <div className={`rounded-lg border ${m.bg} p-3`}>
      <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${m.color}`}>
        <span>{m.icon}</span>
        <span>{title}</span>
        <span className="ml-auto rounded-full bg-white/70 px-1.5 text-[10px]">{items.length}</span>
      </div>
      <ul className="space-y-1.5">
        {items.slice(0, 4).map((i, idx) => (
          <li key={idx} className="text-sm">
            <Link href={`/properties/${i.propertyId}`} className="font-medium text-slate-800 hover:text-brand-700">
              {i.title}
            </Link>
            <span className="text-slate-500">
              {" "}
              — {kind === "VACANT" ? `${i.detail} (${t.insights.openUnit})` : i.detail}
            </span>
            <div className="text-xs text-slate-400">
              {i.date ? formatDate(i.date, locale) : ""}
              {i.amount != null
                ? `${i.date ? " · " : ""}${euro(i.amount, locale)} ${kind === "ARREARS" ? "" : t.insights.rentPerMonth}`
                : ""}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Insights({ data, t, locale }: Props) {
  const total = data.expiring.length + data.vacant.length + data.indexation.length + data.arrears.length;
  return (
    <section className="card p-4">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-700">{t.insights.title}</h2>
        <p className="text-xs text-slate-400">{t.insights.subtitle}</p>
      </div>
      {total === 0 ? (
        <p className="text-sm text-emerald-600">✓ {t.insights.none}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Group title={t.insights.arrears} items={data.arrears} kind="ARREARS" t={t} locale={locale} />
          <Group title={t.insights.vacant} items={data.vacant} kind="VACANT" t={t} locale={locale} />
          <Group title={t.insights.expiring} items={data.expiring} kind="EXPIRING" t={t} locale={locale} />
          <Group title={t.insights.indexation} items={data.indexation} kind="INDEXATION" t={t} locale={locale} />
        </div>
      )}
    </section>
  );
}
