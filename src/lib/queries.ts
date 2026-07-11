import { prisma } from "./db";
import { deriveChargeState } from "./payments";

// ---- Types returned to the UI ----

export interface PropertyStats {
  id: string;
  name: string;
  street: string;
  postalCode: string;
  city: string;
  type: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  ownerName: string;
  ownerType: string;
  wozValue: number | null;
  purchasePrice: number | null;
  purchaseDate: Date | null;
  monthlyIncome: number;
  monthlyCost: number; // incl. mortgage payments
  netCashflow: number;
  grossYield: number | null; // % annual
  netYield: number | null; // % annual
  unitCount: number;
  occupiedUnits: number;
  occupancy: number; // %
  openIssues: number;
  arrearsAmount: number;
  arrearsCount: number;
  health: "good" | "warning" | "critical";
  nextIndexation: Date | null;
  nextLeaseEnd: Date | null;
}

export interface PortfolioKpis {
  propertyCount: number;
  totalValue: number;
  totalPurchase: number;
  monthlyIncome: number;
  monthlyCost: number;
  netCashflow: number;
  totalArrears: number;
  occupancy: number;
  openIssues: number;
  expiringSoon: number; // leases ending within 6 months
  grossYield: number | null;
  byEntity: { name: string; type: string; value: number; income: number; count: number }[];
  byType: { type: string; count: number; value: number }[];
}

const now = () => new Date();

/** Derive the paid amount and status of a rent charge (delegates to pure logic). */
const chargeState = deriveChargeState;

/** All properties with computed stats — powers the dashboard, map and table. */
export async function getPortfolio(): Promise<PropertyStats[]> {
  const today = now();
  const properties = await prisma.property.findMany({
    include: {
      ownerEntity: true,
      mortgages: true,
      issues: { where: { status: { not: "RESOLVED" } } },
      units: {
        include: {
          leases: {
            include: { rentCharges: { include: { payments: true } } },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return properties.map((p) => {
    const activeLeases = p.units.flatMap((u) => u.leases.filter((l) => l.status === "ACTIVE"));
    const monthlyIncome = activeLeases.reduce((s, l) => s + l.monthlyRent + l.serviceCharge, 0);
    const mortgageCost = p.mortgages.reduce((s, m) => s + m.monthlyPayment, 0);
    const monthlyCost = p.monthlyCost + mortgageCost;
    const netCashflow = monthlyIncome - monthlyCost;

    const unitCount = p.units.length;
    const occupiedUnits = p.units.filter((u) => u.leases.some((l) => l.status === "ACTIVE")).length;
    const occupancy = unitCount > 0 ? (occupiedUnits / unitCount) * 100 : 0;

    // Arrears across all charges of this property.
    let arrearsAmount = 0;
    let arrearsCount = 0;
    for (const u of p.units) {
      for (const l of u.leases) {
        for (const c of l.rentCharges) {
          const st = chargeState(c, today);
          if (st.status === "LATE" || st.status === "MISSING" || st.status === "PARTIAL") {
            arrearsAmount += st.outstanding;
            arrearsCount += 1;
          }
        }
      }
    }

    const grossYield = p.wozValue ? (monthlyIncome * 12) / p.wozValue * 100 : null;
    const netYield = p.wozValue ? (netCashflow * 12) / p.wozValue * 100 : null;

    // Next indexation & next lease end across active leases.
    const indexDates = activeLeases
      .map((l) => l.nextReviewDate)
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime());
    const endDates = activeLeases
      .map((l) => l.endDate)
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime());

    const health: PropertyStats["health"] =
      arrearsCount > 0 || occupancy < 50
        ? "critical"
        : p.issues.length > 0 || occupancy < 100
          ? "warning"
          : "good";

    return {
      id: p.id,
      name: p.name,
      street: p.street,
      postalCode: p.postalCode,
      city: p.city,
      type: p.type,
      status: p.status,
      latitude: p.latitude,
      longitude: p.longitude,
      ownerName: p.ownerEntity.name,
      ownerType: p.ownerEntity.type,
      wozValue: p.wozValue,
      purchasePrice: p.purchasePrice,
      purchaseDate: p.purchaseDate,
      monthlyIncome,
      monthlyCost,
      netCashflow,
      grossYield,
      netYield,
      unitCount,
      occupiedUnits,
      occupancy,
      openIssues: p.issues.length,
      arrearsAmount,
      arrearsCount,
      health,
      nextIndexation: indexDates[0] ?? null,
      nextLeaseEnd: endDates[0] ?? null,
    };
  });
}

export async function getKpis(): Promise<PortfolioKpis> {
  const portfolio = await getPortfolio();
  const today = now();
  const sixMonths = new Date(today.getTime() + 183 * 24 * 60 * 60 * 1000);

  const totalValue = portfolio.reduce((s, p) => s + (p.wozValue ?? 0), 0);
  const totalPurchase = portfolio.reduce((s, p) => s + (p.purchasePrice ?? 0), 0);
  const monthlyIncome = portfolio.reduce((s, p) => s + p.monthlyIncome, 0);
  const monthlyCost = portfolio.reduce((s, p) => s + p.monthlyCost, 0);
  const totalArrears = portfolio.reduce((s, p) => s + p.arrearsAmount, 0);
  const openIssues = portfolio.reduce((s, p) => s + p.openIssues, 0);
  const totalUnits = portfolio.reduce((s, p) => s + p.unitCount, 0);
  const occupiedUnits = portfolio.reduce((s, p) => s + p.occupiedUnits, 0);
  const expiringSoon = portfolio.filter(
    (p) => p.nextLeaseEnd && p.nextLeaseEnd <= sixMonths && p.nextLeaseEnd >= today,
  ).length;

  const entityMap = new Map<string, { name: string; type: string; value: number; income: number; count: number }>();
  const typeMap = new Map<string, { type: string; count: number; value: number }>();
  for (const p of portfolio) {
    const e = entityMap.get(p.ownerName) ?? { name: p.ownerName, type: p.ownerType, value: 0, income: 0, count: 0 };
    e.value += p.wozValue ?? 0;
    e.income += p.monthlyIncome;
    e.count += 1;
    entityMap.set(p.ownerName, e);
    const t = typeMap.get(p.type) ?? { type: p.type, count: 0, value: 0 };
    t.count += 1;
    t.value += p.wozValue ?? 0;
    typeMap.set(p.type, t);
  }

  return {
    propertyCount: portfolio.length,
    totalValue,
    totalPurchase,
    monthlyIncome,
    monthlyCost,
    netCashflow: monthlyIncome - monthlyCost,
    totalArrears,
    occupancy: totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0,
    openIssues,
    expiringSoon,
    grossYield: totalValue > 0 ? (monthlyIncome * 12) / totalValue * 100 : null,
    byEntity: [...entityMap.values()].sort((a, b) => b.value - a.value),
    byType: [...typeMap.values()].sort((a, b) => b.count - a.count),
  };
}

export interface ArrearsRow {
  chargeId: string;
  tenant: string;
  propertyId: string;
  propertyName: string;
  city: string;
  periodYm: string;
  dueDate: Date;
  amount: number;
  outstanding: number;
  daysLate: number;
  bucket: string;
  status: string;
}

export async function getArrears(): Promise<ArrearsRow[]> {
  const today = now();
  const charges = await prisma.rentCharge.findMany({
    include: {
      payments: true,
      lease: { include: { tenant: true, unit: { include: { property: true } } } },
    },
  });
  const rows: ArrearsRow[] = [];
  for (const c of charges) {
    const st = chargeState(c, today);
    if (st.status === "LATE" || st.status === "MISSING" || st.status === "PARTIAL") {
      rows.push({
        chargeId: c.id,
        tenant: c.lease.tenant.name,
        propertyId: c.lease.unit.property.id,
        propertyName: c.lease.unit.property.name,
        city: c.lease.unit.property.city,
        periodYm: c.periodYm,
        dueDate: c.dueDate,
        amount: c.amount,
        outstanding: st.outstanding,
        daysLate: st.overdueDays,
        bucket: st.bucket,
        status: st.status,
      });
    }
  }
  return rows.sort((a, b) => b.daysLate - a.daysLate);
}

export async function getPropertyDetail(id: string) {
  const today = now();
  const p = await prisma.property.findUnique({
    where: { id },
    include: {
      ownerEntity: true,
      mortgages: true,
      valuations: { orderBy: { date: "asc" } },
      projects: true,
      issues: { orderBy: { createdAt: "desc" } },
      units: {
        include: {
          leases: {
            include: {
              tenant: true,
              rentCharges: { include: { payments: true }, orderBy: { periodYm: "desc" } },
            },
          },
        },
      },
    },
  });
  if (!p) return null;

  const stats = (await getPortfolio()).find((s) => s.id === id)!;

  // Flatten recent charges for a payments timeline.
  const charges = p.units.flatMap((u) =>
    u.leases.flatMap((l) =>
      l.rentCharges.map((c) => {
        const st = chargeState(c, today);
        return {
          id: c.id,
          tenant: l.tenant.name,
          periodYm: c.periodYm,
          dueDate: c.dueDate,
          amount: c.amount,
          outstanding: st.outstanding,
          status: st.status,
          daysLate: st.overdueDays,
        };
      }),
    ),
  );

  return { property: p, stats, charges };
}

export async function getIssues() {
  return prisma.issue.findMany({
    include: { property: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function getProjects() {
  return prisma.project.findMany({
    include: { property: true },
    orderBy: { createdAt: "desc" },
  });
}
