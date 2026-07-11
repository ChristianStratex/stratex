import Link from "next/link";
import { getI18n } from "@/i18n";
import { getIssues } from "@/lib/queries";
import { euro, formatDate } from "@/lib/format";
import { IssueStatusBadge, PriorityBadge } from "@/components/badges";
import { label, ISSUE_CATEGORY_LABELS, ISSUE_RAISED_BY_LABELS } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function IssuesPage() {
  const { locale, t } = getI18n();
  const issues = await getIssues();
  const open = issues.filter((i) => i.status !== "RESOLVED");

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{t.issues.title}</h1>
        <p className="text-sm text-slate-500">{t.issues.subtitle}</p>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="stat-label">Open</div>
          <div className="stat-value mt-1 text-red-600">{open.length}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">{t.common.total}</div>
          <div className="stat-value mt-1">{issues.length}</div>
        </div>
        <div className="card p-4">
          <div className="stat-label">{t.issues.cost}</div>
          <div className="stat-value mt-1">
            {euro(open.reduce((s, i) => s + (i.cost ?? 0), 0), locale, { compact: true })}
          </div>
        </div>
      </section>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">{t.issues.title_}</th>
                <th className="th">{t.issues.property}</th>
                <th className="th">{t.issues.category}</th>
                <th className="th">{t.issues.raisedBy}</th>
                <th className="th text-right">{t.issues.cost}</th>
                <th className="th">{t.issues.priority}</th>
                <th className="th">{t.issues.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {issues.map((i) => (
                <tr key={i.id} className="hover:bg-slate-50">
                  <td className="td font-medium text-slate-800">{i.title}</td>
                  <td className="td">
                    <Link href={`/properties/${i.propertyId}`} className="text-brand-700 hover:underline">
                      {i.property.name}
                    </Link>
                  </td>
                  <td className="td">{label(ISSUE_CATEGORY_LABELS, i.category, locale)}</td>
                  <td className="td">{label(ISSUE_RAISED_BY_LABELS, i.raisedBy, locale)}</td>
                  <td className="td text-right tabular-nums">{i.cost ? euro(i.cost, locale) : "—"}</td>
                  <td className="td">
                    <PriorityBadge priority={i.priority} locale={locale} />
                  </td>
                  <td className="td">
                    <IssueStatusBadge status={i.status} locale={locale} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
