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

  const [users, tenants, entities] = await Promise.all([
    prisma.user.findMany({ include: { tenant: true }, orderBy: { createdAt: "asc" } }),
    prisma.tenant.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.legalEntity.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { properties: true } } },
    }),
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
    </div>
  );
}
