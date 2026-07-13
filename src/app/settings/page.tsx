import { getI18n } from "@/i18n";
import { getRole, can } from "@/lib/rbac";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { AdminUsers } from "@/components/AdminUsers";
import { AdminEntities } from "@/components/AdminEntities";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { locale } = getI18n();
  const nl = locale === "nl";
  const session = getSession();

  if (!can("admin", getRole())) {
    return (
      <div className="card p-8 text-center">
        <div className="text-3xl">🔒</div>
        <p className="mt-2 text-sm text-slate-500">
          {nl ? "Alleen de eigenaar heeft toegang tot instellingen." : "Only the owner can access settings."}
        </p>
      </div>
    );
  }

  const [users, tenants, entities, auditLog] = await Promise.all([
    prisma.user.findMany({ include: { tenant: true }, orderBy: { createdAt: "asc" } }),
    prisma.tenant.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.legalEntity.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { properties: true } } },
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">{nl ? "Instellingen" : "Settings"}</h1>
        <p className="text-sm text-slate-500">
          {nl ? "Beheer gebruikers, rollen en juridische entiteiten" : "Manage users, roles and legal entities"}
        </p>
      </header>

      <AdminUsers
        currentUid={session!.uid}
        locale={locale}
        tenants={tenants}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          tenantName: u.tenant?.name ?? null,
        }))}
      />

      <AdminEntities
        locale={locale}
        entities={entities.map((e) => ({
          id: e.id,
          name: e.name,
          type: e.type,
          kvkNumber: e.kvkNumber,
          taxRegime: e.taxRegime,
          propertyCount: e._count.properties,
        }))}
      />

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">{nl ? "Auditlogboek" : "Audit log"}</h2>
        {auditLog.length === 0 ? (
          <p className="text-sm text-slate-400">{nl ? "Nog geen activiteit." : "No activity yet."}</p>
        ) : (
          <ul className="divide-y divide-slate-50 text-sm">
            {auditLog.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-3 py-1.5">
                <span className="text-slate-700">
                  <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{a.action}</span>
                  {a.detail}
                </span>
                <span className="text-xs text-slate-400">
                  {a.actorName} · {a.createdAt.toLocaleString(nl ? "nl-NL" : "en-GB")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
