import Link from "next/link";
import { getI18n } from "@/i18n";
import { getProjects } from "@/lib/queries";
import { euro, formatDate } from "@/lib/format";
import { ProjectStatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { locale, t } = getI18n();
  const projects = await getProjects();

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{t.projects.title}</h1>
        <p className="text-sm text-slate-500">{t.projects.subtitle}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((pr) => {
          const pct = pr.budget ? Math.min(100, Math.round((pr.spent / pr.budget) * 100)) : 0;
          return (
            <div key={pr.id} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900">{pr.name}</h3>
                  {pr.property && (
                    <Link href={`/properties/${pr.propertyId}`} className="text-xs text-brand-600 hover:underline">
                      {pr.property.name}
                    </Link>
                  )}
                </div>
                <ProjectStatusBadge status={pr.status} locale={locale} />
              </div>
              {pr.description && <p className="mt-2 text-sm text-slate-500">{pr.description}</p>}

              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>
                    {t.projects.spent}: {euro(pr.spent, locale, { compact: true })}
                  </span>
                  <span>
                    {t.projects.budget}: {euro(pr.budget, locale, { compact: true })}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-right text-xs text-slate-400">{pct}%</div>
              </div>

              <div className="mt-3 flex justify-between text-xs text-slate-400">
                <span>{formatDate(pr.startDate, locale)}</span>
                <span>→ {formatDate(pr.targetDate, locale)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
