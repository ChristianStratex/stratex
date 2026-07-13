import { prisma } from "./db";
import { deriveChargeState } from "./payments";
import { getSession } from "./session";

/** Portal data for the logged-in TENANT user: own leases, charges, issues. */
export async function getPortalData() {
  const session = getSession();
  if (!session || session.role !== "TENANT") return null;

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    include: {
      tenant: {
        include: {
          leases: {
            include: {
              unit: { include: { property: true } },
              rentCharges: { include: { payments: true }, orderBy: { periodYm: "desc" } },
            },
          },
        },
      },
    },
  });
  if (!user?.tenant) return null;

  const today = new Date();
  const leases = user.tenant.leases
    .filter((l) => l.status === "ACTIVE")
    .map((l) => ({
      id: l.id,
      property: l.unit.property.name,
      propertyId: l.unit.property.id,
      address: `${l.unit.property.street}, ${l.unit.property.city}`,
      unit: l.unit.label,
      monthlyRent: l.monthlyRent + l.serviceCharge,
      endDate: l.endDate,
      charges: l.rentCharges.slice(0, 12).map((c) => {
        const st = deriveChargeState(c, today);
        return {
          id: c.id,
          periodYm: c.periodYm,
          amount: c.amount,
          outstanding: st.outstanding,
          status: st.status,
        };
      }),
    }));

  const propertyIds = [...new Set(leases.map((l) => l.propertyId))];
  const issues = await prisma.issue.findMany({
    where: { propertyId: { in: propertyIds }, raisedBy: "TENANT" },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { property: true },
  });

  const totalOutstanding = leases.reduce(
    (s, l) => s + l.charges.reduce((s2, c) => s2 + c.outstanding, 0),
    0,
  );

  return { tenantName: user.tenant.name, leases, issues, totalOutstanding, propertyIds };
}
