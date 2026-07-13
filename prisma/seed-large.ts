/**
 * StrateX LARGE demo seed — ~300 fictional properties.
 *
 * Purpose: prove the dashboard stays fast at "hundreds of properties" scale.
 * ⚠️  ALL DATA IS SYNTHETIC / FICTIONAL — generated names, addresses, tenants,
 * values. No real person's or company's holdings are represented.
 *
 * Run: npm run db:seed:large
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const prisma = new PrismaClient();
const DEMO_PASSWORD = hashPassword("demo2026");

const PROPERTY_COUNT = 300;
const MONTHS_HISTORY = 3;

// Deterministic PRNG so the seed is reproducible.
let rngState = 42;
function rnd(): number {
  rngState = (rngState * 1103515245 + 12345) % 2147483648;
  return rngState / 2147483648;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}
function between(min: number, max: number): number {
  return min + rnd() * (max - min);
}

function ym(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

// Fictional Frisian/Northern-NL geography (city, lat, lng, weight)
const CITIES: [string, number, number, number][] = [
  ["Leeuwarden", 53.2012, 5.7999, 30],
  ["Dokkum", 53.3260, 5.9980, 12],
  ["Drachten", 53.1122, 6.0989, 12],
  ["Sneek", 53.0330, 5.6589, 10],
  ["Heerenveen", 52.9602, 5.9195, 10],
  ["Harlingen", 53.1736, 5.4207, 6],
  ["Franeker", 53.1867, 5.5404, 5],
  ["Groningen", 53.2194, 6.5665, 8],
  ["Assen", 52.9925, 6.5649, 4],
  ["Zwolle", 52.5168, 6.0830, 3],
];
const STREETS = [
  "Industrieweg", "Handelskade", "Marktstraat", "Stationsplein", "Nijverheidslaan",
  "Havenstraat", "Kerkplein", "Molenweg", "Dorpsstraat", "Ambachtsweg",
  "Zuiderpark", "Noorderlaan", "Oosterkade", "Westersingel", "Middelzeelaan",
];
const TYPES: [string, number][] = [
  ["OFFICE", 22], ["RETAIL", 30], ["LOGISTICS", 10], ["RESIDENTIAL", 20],
  ["MIXED", 12], ["MONUMENT", 4], ["LAND", 2],
];
const TENANT_PREFIX = [
  "Handelsonderneming", "Advocatenkantoor", "Fysiotherapie", "Bakkerij", "Installatiebedrijf",
  "Uitzendbureau", "Softwarebedrijf", "Accountantskantoor", "Restaurant", "Kapsalon",
  "Groothandel", "Autobedrijf", "Tandartspraktijk", "Sportschool", "Reclamebureau",
];
const TENANT_SUFFIX = [
  "Van der Meer", "Hoekstra", "De Jong", "Visser", "Dijkstra", "Van Dijk", "Bosma",
  "Terpstra", "Zijlstra", "De Boer", "Postma", "Wiersma", "Jansma", "Algra", "Faber",
];

function weightedPick<T>(items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [v, w] of items) {
    r -= w;
    if (r <= 0) return v;
  }
  return items[0][0];
}

async function main() {
  console.log(`Generating ${PROPERTY_COUNT} fictional properties…`);

  // Wipe
  await prisma.payment.deleteMany();
  await prisma.rentCharge.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.valuation.deleteMany();
  await prisma.mortgage.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.project.deleteMany();
  await prisma.property.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.legalEntity.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.createMany({
    data: [
      { name: "Demo Eigenaar", email: "owner@example.nl", role: "OWNER", locale: "nl", passwordHash: DEMO_PASSWORD },
      { name: "Portfolio Manager", email: "manager@example.nl", role: "MANAGER", locale: "nl", passwordHash: DEMO_PASSWORD },
      { name: "Accountant", email: "boekhouding@example.nl", role: "ACCOUNTANT", locale: "nl", passwordHash: DEMO_PASSWORD },
      { name: "Kijker", email: "viewer@example.nl", role: "VIEWER", locale: "nl", passwordHash: DEMO_PASSWORD },
    ],
  });

  // Entities — a realistic multi-BV structure
  const entityDefs = [
    { name: "Eigenaar (privé)", type: "PERSONAL", taxRegime: "BOX3", weight: 10 },
    { name: "Waddenstate Vastgoed B.V.", type: "BV", kvkNumber: "34567891", taxRegime: "VPB", weight: 35 },
    { name: "Waddenstate Holding B.V.", type: "HOLDING", taxRegime: "VPB", weight: 20 },
    { name: "Noorderlicht Vastgoed B.V.", type: "BV", kvkNumber: "45678912", taxRegime: "VPB", weight: 20 },
    { name: "Projectontwikkeling Noord B.V.", type: "SPV", taxRegime: "VPB", weight: 8 },
    { name: "Stadsherstel Frisia B.V.", type: "SPV", taxRegime: "VPB", weight: 7 },
  ];
  const entities: { id: string; weight: number }[] = [];
  for (const e of entityDefs) {
    const created = await prisma.legalEntity.create({
      data: { name: e.name, type: e.type, kvkNumber: (e as any).kvkNumber, taxRegime: e.taxRegime },
    });
    entities.push({ id: created.id, weight: e.weight });
  }
  const entityPickList: [string, number][] = entities.map((e) => [e.id, e.weight]);

  // Tenant pool
  const tenantData = Array.from({ length: 120 }, (_, i) => ({
    name: `${pick(TENANT_PREFIX)} ${pick(TENANT_SUFFIX)} ${i % 7 === 0 ? "B.V." : ""}`.trim(),
    email: `contact${i}@example.nl`,
    kvkNumber: String(70000000 + i * 97),
  }));
  await prisma.tenant.createMany({ data: tenantData });
  const tenants = await prisma.tenant.findMany({ select: { id: true } });

  const today = new Date();
  let unitCount = 0;
  let leaseCount = 0;
  let chargeCount = 0;

  for (let i = 0; i < PROPERTY_COUNT; i++) {
    const [city, baseLat, baseLng] = CITIES[
      (() => {
        // weighted city pick
        const total = CITIES.reduce((s, c) => s + c[3], 0);
        let r = rnd() * total;
        for (let j = 0; j < CITIES.length; j++) {
          r -= CITIES[j][3];
          if (r <= 0) return j;
        }
        return 0;
      })()
    ];
    const type = weightedPick(TYPES);
    const street = pick(STREETS);
    const nr = Math.floor(between(1, 180));
    const purchaseYear = Math.floor(between(2008, 2025));
    const woz = Math.round(between(250_000, 4_500_000) / 10_000) * 10_000;
    const purchasePrice = Math.round((woz * between(0.65, 0.95)) / 10_000) * 10_000;
    const status = rnd() < 0.06 ? "IN_DEVELOPMENT" : rnd() < 0.03 ? "FOR_SALE" : "ACTIVE";

    const property = await prisma.property.create({
      data: {
        name: `${type === "RETAIL" ? "Winkelpand" : type === "OFFICE" ? "Kantoorpand" : type === "LOGISTICS" ? "Bedrijfshal" : type === "RESIDENTIAL" ? "Wooncomplex" : type === "MONUMENT" ? "Monumentaal pand" : type === "LAND" ? "Kavel" : "Bedrijfspand"} ${street} ${city}`,
        street: `${street} ${nr}`,
        postalCode: `${Math.floor(between(8000, 9999))} ${String.fromCharCode(65 + Math.floor(rnd() * 26))}${String.fromCharCode(65 + Math.floor(rnd() * 26))}`,
        city,
        latitude: baseLat + between(-0.025, 0.025),
        longitude: baseLng + between(-0.04, 0.04),
        type,
        status,
        purchasePrice,
        purchaseDate: new Date(purchaseYear, Math.floor(rnd() * 12), 15),
        wozValue: woz,
        monthlyCost: Math.round(woz * between(0.0006, 0.0013)),
        ownerEntityId: weightedPick(entityPickList),
      },
    });

    // Units + leases
    if (type === "LAND" || status === "IN_DEVELOPMENT") continue;
    const nUnits = type === "RESIDENTIAL" ? Math.floor(between(2, 8)) : Math.floor(between(1, 4));
    for (let u = 0; u < nUnits; u++) {
      const unit = await prisma.unit.create({
        data: {
          label: nUnits === 1 ? "Hoofdruimte" : `Unit ${String.fromCharCode(65 + u)}`,
          floorAreaM2: Math.round(between(45, 800)),
          propertyId: property.id,
        },
      });
      unitCount++;
      if (rnd() < 0.09) continue; // ~9% vacancy

      const rent = Math.round((woz / nUnits) * between(0.045, 0.075) / 12 / 10) * 10;
      const service = Math.round(rent * between(0.06, 0.14));
      const lease = await prisma.lease.create({
        data: {
          unitId: unit.id,
          tenantId: pick(tenants).id,
          startDate: new Date(purchaseYear + 1, 0, 1),
          endDate: addMonths(today, Math.floor(between(2, 48))),
          monthlyRent: rent,
          serviceCharge: service,
          deposit: rent * 3,
          indexationClause: true,
          lastIndexedAt: new Date(today.getFullYear(), 0, 1),
          nextReviewDate: new Date(today.getFullYear() + 1, 0, 1),
          status: "ACTIVE",
        },
      });
      leaseCount++;

      const latePayer = rnd() < 0.08;
      for (let m = MONTHS_HISTORY; m >= 1; m--) {
        const period = addMonths(today, -m + 1);
        const due = new Date(period.getFullYear(), period.getMonth(), 1);
        const amount = rent + service;
        const charge = await prisma.rentCharge.create({
          data: { leaseId: lease.id, periodYm: ym(period), dueDate: due, amount, status: "OPEN" },
        });
        chargeCount++;
        if (!(latePayer && m <= 2)) {
          await prisma.payment.create({
            data: { rentChargeId: charge.id, amount, receivedAt: new Date(due.getFullYear(), due.getMonth(), 2), reference: "SEPA incasso" },
          });
        }
      }
    }

    // Sprinkle issues
    if (rnd() < 0.15) {
      await prisma.issue.create({
        data: {
          propertyId: property.id,
          title: pick(["Lekkage dak", "CV-storing", "Schilderwerk nodig", "Liftonderhoud", "Gevelrenovatie", "Vochtprobleem kelder"]),
          raisedBy: pick(["TENANT", "MANAGER", "OWNER"]),
          category: "MAINTENANCE",
          priority: pick(["LOW", "MEDIUM", "HIGH"]),
          status: pick(["OPEN", "IN_PROGRESS"]),
          cost: Math.round(between(300, 15000) / 100) * 100,
        },
      });
    }
  }

  // A few projects
  const devProps = await prisma.property.findMany({ where: { status: "IN_DEVELOPMENT" }, take: 8 });
  for (const p of devProps) {
    await prisma.project.create({
      data: {
        propertyId: p.id,
        name: `Herontwikkeling ${p.name}`,
        status: "IN_PROGRESS",
        budget: Math.round((p.wozValue ?? 1_000_000) * 0.4),
        spent: Math.round((p.wozValue ?? 1_000_000) * between(0.05, 0.3)),
        startDate: addMonths(today, -Math.floor(between(1, 8))),
        targetDate: addMonths(today, Math.floor(between(6, 20))),
      },
    });
  }

  console.log("Large seed complete:", {
    properties: PROPERTY_COUNT,
    units: unitCount,
    leases: leaseCount,
    charges: chargeCount,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
