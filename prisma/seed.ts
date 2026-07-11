/**
 * StrateX demo seed.
 *
 * ⚠️  ALL DATA HERE IS SYNTHETIC / ILLUSTRATIVE and fully fictional. Entity names,
 * addresses, tenants, rents, WOZ values, KvK numbers and payment histories are
 * invented for demonstration only and do NOT represent any real person, company,
 * or holdings. Real portfolios must be loaded from authoritative sources (KvK,
 * Kadaster) or entered by the owner's team.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MONTHS_HISTORY = 6;

function ym(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

async function main() {
  console.log("Resetting demo data…");
  // Order matters for FK integrity.
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

  // --- Users (RBAC demo) ---
  await prisma.user.createMany({
    data: [
      { name: "Demo Eigenaar", email: "owner@example.nl", role: "OWNER", locale: "nl" },
      { name: "Portfolio Manager", email: "manager@example.nl", role: "MANAGER", locale: "nl" },
      { name: "Accountant", email: "boekhouding@example.nl", role: "ACCOUNTANT", locale: "nl" },
    ],
  });

  // --- Legal entities (the ownership layer that drives the tax module) ---
  const personal = await prisma.legalEntity.create({
    data: { name: "Eigenaar (privé)", type: "PERSONAL", taxRegime: "BOX3" },
  });
  const eye = await prisma.legalEntity.create({
    data: { name: "Waddenstate Vastgoed B.V.", type: "BV", kvkNumber: "34567891", taxRegime: "VPB" },
  });
  const holding = await prisma.legalEntity.create({
    data: { name: "Waddenstate Holding B.V.", type: "HOLDING", taxRegime: "VPB" },
  });
  const mah = await prisma.legalEntity.create({
    data: { name: "Projectontwikkeling Noord B.V.", type: "SPV", taxRegime: "VPB" },
  });

  const entities = { personal, eye, holding, mah };

  // --- Tenants (synthetic companies) ---
  const tenantNames = [
    "Friesland Advocaten", "De Vries Retail B.V.", "TechNoord BV", "Bakkerij Hoekstra",
    "Zorggroep Sûnenz", "Logistiek Fryslân BV", "Kappersstudio Anne", "Notariaat Wadden",
    "Fysio Centrum Leeuwarden", "Café De Prins", "Startup Hub 058", "Boekhandel Van der Meer",
    "Praktijk Tandarts Dijkstra", "Cateringbedrijf Sjoerd", "Design Studio Wolkom", "ICT Beheer Noord",
    "Uitzendbureau Flexwurk", "Reisbureau Terpstra", "Kwekerij Groenendijk", "Sportschool FitFries",
  ];
  const tenants = await Promise.all(
    tenantNames.map((name, i) =>
      prisma.tenant.create({
        data: {
          name,
          contact: `Contactpersoon ${i + 1}`,
          email: `info@${name.toLowerCase().replace(/[^a-z]/g, "")}.nl`,
          phone: `058-${String(1000000 + i * 37).slice(0, 7)}`,
          kvkNumber: String(60000000 + i * 131),
        },
      }),
    ),
  );

  // --- Property templates (synthetic, realistic Friesland geography) ---
  type Tmpl = {
    name: string; street: string; postalCode: string; city: string;
    lat: number; lng: number; type: string; status?: string;
    purchasePrice: number; purchaseYear: number; woz: number; monthlyCost: number;
    ownerKey: keyof typeof entities;
    units: { label: string; area: number; rent: number; service: number; vacant?: boolean }[];
    mortgage?: { lender: string; principal: number; rate: number; monthly: number };
  };

  const templates: Tmpl[] = [
    {
      name: "Kantoorpand Zaailand", street: "Wilhelminaplein 12", postalCode: "8911 BS", city: "Leeuwarden",
      lat: 53.1997, lng: 5.7920, type: "OFFICE", purchasePrice: 1850000, purchaseYear: 2018, woz: 2340000,
      monthlyCost: 2100, ownerKey: "eye",
      units: [
        { label: "Begane grond", area: 320, rent: 4200, service: 650 },
        { label: "1e verdieping", area: 300, rent: 3900, service: 600 },
        { label: "2e verdieping", area: 280, rent: 3600, service: 550 },
      ],
      mortgage: { lender: "Rabobank", principal: 1200000, rate: 4.1, monthly: 6100 },
    },
    {
      name: "Winkelpand Nieuwestad", street: "Nieuwestad 88", postalCode: "8911 CJ", city: "Leeuwarden",
      lat: 53.2010, lng: 5.7970, type: "RETAIL", purchasePrice: 980000, purchaseYear: 2016, woz: 1210000,
      monthlyCost: 900, ownerKey: "eye",
      units: [{ label: "Winkelruimte", area: 210, rent: 5200, service: 400 }],
      mortgage: { lender: "ING", principal: 620000, rate: 3.8, monthly: 3050 },
    },
    {
      name: "Voormalige supermarkt Dokkum", street: "Hantumerweg 25", postalCode: "9101 EA", city: "Dokkum",
      lat: 53.3256, lng: 5.9990, type: "RETAIL", status: "IN_DEVELOPMENT", purchasePrice: 1280000, purchaseYear: 2023,
      woz: 1360000, monthlyCost: 1500, ownerKey: "eye",
      units: [{ label: "Bedrijfsruimte", area: 1240, rent: 0, service: 0, vacant: true }],
    },
    {
      name: "Monumentaal grachtenpand", street: "Diepswal 5", postalCode: "9101 LA", city: "Dokkum",
      lat: 53.3270, lng: 5.9975, type: "MONUMENT", purchasePrice: 720000, purchaseYear: 2020, woz: 890000,
      monthlyCost: 1100, ownerKey: "personal",
      units: [
        { label: "Horeca begane grond", area: 140, rent: 2400, service: 300 },
        { label: "Appartement boven", area: 95, rent: 1350, service: 120 },
      ],
    },
    {
      name: "Bedrijfsverzamelgebouw De Hemrik", street: "Ampèrelaan 6", postalCode: "8912 AA", city: "Leeuwarden",
      lat: 53.1880, lng: 5.8290, type: "MIXED", purchasePrice: 2400000, purchaseYear: 2015, woz: 3050000,
      monthlyCost: 3200, ownerKey: "eye",
      units: [
        { label: "Unit A", area: 240, rent: 2600, service: 300 },
        { label: "Unit B", area: 240, rent: 2600, service: 300 },
        { label: "Unit C", area: 180, rent: 1950, service: 220 },
        { label: "Unit D", area: 180, rent: 0, service: 0, vacant: true },
      ],
      mortgage: { lender: "ABN AMRO", principal: 1500000, rate: 4.4, monthly: 7600 },
    },
    {
      name: "Logistiek centrum Heerenveen", street: "Marconilaan 22", postalCode: "8448 CM", city: "Heerenveen",
      lat: 52.9600, lng: 5.9180, type: "LOGISTICS", purchasePrice: 3100000, purchaseYear: 2019, woz: 3680000,
      monthlyCost: 2800, ownerKey: "holding",
      units: [{ label: "Distributiehal", area: 4200, rent: 19500, service: 1200 }],
      mortgage: { lender: "Rabobank", principal: 2100000, rate: 4.2, monthly: 10800 },
    },
    {
      name: "Woonzorgproject Harlingen", street: "Grote Bredeplaats 10", postalCode: "8861 BD", city: "Harlingen",
      lat: 53.1740, lng: 5.4180, type: "RESIDENTIAL", status: "IN_DEVELOPMENT", purchasePrice: 1650000,
      purchaseYear: 2024, woz: 1720000, monthlyCost: 1400, ownerKey: "mah",
      units: [{ label: "Zorgappartementen (24)", area: 1800, rent: 0, service: 0, vacant: true }],
    },
    {
      name: "Kantoorpand Snekertrekweg", street: "Snekertrekweg 60", postalCode: "8912 AA", city: "Leeuwarden",
      lat: 53.1960, lng: 5.7830, type: "OFFICE", purchasePrice: 2200000, purchaseYear: 2022, woz: 2410000,
      monthlyCost: 2600, ownerKey: "eye",
      units: [
        { label: "Vleugel Noord", area: 1950, rent: 14200, service: 1600 },
        { label: "Vleugel Zuid", area: 1959, rent: 0, service: 0, vacant: true },
      ],
      mortgage: { lender: "ING", principal: 1400000, rate: 4.3, monthly: 7200 },
    },
    {
      name: "Winkelstrip Sneek", street: "Oosterdijk 14", postalCode: "8601 BA", city: "Sneek",
      lat: 53.0330, lng: 5.6580, type: "RETAIL", purchasePrice: 1120000, purchaseYear: 2017, woz: 1330000,
      monthlyCost: 1000, ownerKey: "holding",
      units: [
        { label: "Winkel 1", area: 120, rent: 2200, service: 200 },
        { label: "Winkel 2", area: 110, rent: 2000, service: 180 },
      ],
    },
    {
      name: "Bedrijfspand Drachten", street: "De Bolder 30", postalCode: "9206 AM", city: "Drachten",
      lat: 53.1120, lng: 6.0980, type: "MIXED", purchasePrice: 1450000, purchaseYear: 2021, woz: 1610000,
      monthlyCost: 1300, ownerKey: "eye",
      units: [
        { label: "Kantoor", area: 300, rent: 3100, service: 350 },
        { label: "Werkplaats", area: 500, rent: 3400, service: 300 },
      ],
      mortgage: { lender: "Rabobank", principal: 900000, rate: 4.0, monthly: 4600 },
    },
    {
      name: "Appartementencomplex Vlietzone", street: "Van Loonstraat 8", postalCode: "8921 AB", city: "Leeuwarden",
      lat: 53.2080, lng: 5.8090, type: "RESIDENTIAL", purchasePrice: 2650000, purchaseYear: 2020, woz: 3120000,
      monthlyCost: 2400, ownerKey: "personal",
      units: [
        { label: "App. 1", area: 75, rent: 1150, service: 90 },
        { label: "App. 2", area: 75, rent: 1150, service: 90 },
        { label: "App. 3", area: 80, rent: 1250, service: 95 },
        { label: "App. 4", area: 80, rent: 1250, service: 95 },
      ],
      mortgage: { lender: "ABN AMRO", principal: 1700000, rate: 3.9, monthly: 8300 },
    },
    {
      name: "Horecapand Grote Markt", street: "Grote Kerkstraat 3", postalCode: "8911 DZ", city: "Leeuwarden",
      lat: 53.2025, lng: 5.7935, type: "RETAIL", purchasePrice: 890000, purchaseYear: 2019, woz: 1040000,
      monthlyCost: 800, ownerKey: "personal",
      units: [{ label: "Café-restaurant", area: 260, rent: 4100, service: 350 }],
    },
    {
      name: "Kavel bedrijventerrein Newton", street: "Newtonpark 40", postalCode: "8914 BH", city: "Leeuwarden",
      lat: 53.1930, lng: 5.8210, type: "LAND", status: "FOR_SALE", purchasePrice: 640000, purchaseYear: 2022,
      woz: 720000, monthlyCost: 150, ownerKey: "holding",
      units: [],
    },
  ];

  const today = new Date();

  for (const t of templates) {
    const owner = entities[t.ownerKey];
    const property = await prisma.property.create({
      data: {
        name: t.name, street: t.street, postalCode: t.postalCode, city: t.city,
        latitude: t.lat, longitude: t.lng, type: t.type, status: t.status ?? "ACTIVE",
        purchasePrice: t.purchasePrice, purchaseDate: new Date(t.purchaseYear, 5, 15),
        wozValue: t.woz, monthlyCost: t.monthlyCost, ownerEntityId: owner.id,
        kadasterRef: `${t.city.slice(0, 3).toUpperCase()}00-${Math.floor(1000 + Math.random() * 8999)}`,
      },
    });

    // Valuations: purchase + WOZ history.
    await prisma.valuation.createMany({
      data: [
        { propertyId: property.id, date: new Date(t.purchaseYear, 5, 15), value: t.purchasePrice, kind: "PURCHASE" },
        { propertyId: property.id, date: new Date(today.getFullYear() - 1, 0, 1), value: Math.round(t.woz * 0.95), kind: "WOZ" },
        { propertyId: property.id, date: new Date(today.getFullYear(), 0, 1), value: t.woz, kind: "WOZ" },
      ],
    });

    if (t.mortgage) {
      await prisma.mortgage.create({
        data: {
          propertyId: property.id, lender: t.mortgage.lender, principal: t.mortgage.principal,
          interestRate: t.mortgage.rate, monthlyPayment: t.mortgage.monthly,
          startDate: new Date(t.purchaseYear, 5, 15),
        },
      });
    }

    // Units + leases + rent charges + payments.
    let tenantIdx = 0;
    for (const u of t.units) {
      const unit = await prisma.unit.create({
        data: { label: u.label, floorAreaM2: u.area, propertyId: property.id },
      });
      if (u.vacant || u.rent === 0) continue;

      const tenant = tenants[(templates.indexOf(t) * 3 + tenantIdx) % tenants.length];
      tenantIdx++;
      const start = new Date(t.purchaseYear + 1, 0, 1);
      const lease = await prisma.lease.create({
        data: {
          unitId: unit.id, tenantId: tenant.id, startDate: start,
          endDate: addMonths(today, [8, 14, 26, 40, 3][tenantIdx % 5]), // varied expiries incl. some soon
          monthlyRent: u.rent, serviceCharge: u.service, deposit: u.rent * 3,
          indexationClause: true,
          lastIndexedAt: new Date(today.getFullYear(), 0, 1),
          nextReviewDate: new Date(today.getFullYear() + 1, 0, 1),
          status: "ACTIVE",
        },
      });

      // Rent charges for the last N months, with a realistic payment pattern.
      for (let m = MONTHS_HISTORY; m >= 1; m--) {
        const period = addMonths(today, -m + 1);
        const due = new Date(period.getFullYear(), period.getMonth(), 1);
        const amount = u.rent + u.service;
        const charge = await prisma.rentCharge.create({
          data: { leaseId: lease.id, periodYm: ym(period), dueDate: due, amount, status: "OPEN" },
        });

        // Payment behaviour: most pay on time; a few tenants are late/missing on recent months.
        const isLatePayer = (tenantIdx + templates.indexOf(t)) % 7 === 0;
        const isPartial = (tenantIdx + templates.indexOf(t)) % 11 === 0;
        if (m >= 2 || !isLatePayer) {
          // paid (on time for older months)
          if (isPartial && m <= 2) {
            await prisma.payment.create({
              data: { rentChargeId: charge.id, amount: Math.round(amount * 0.6), receivedAt: addMonths(due, 0), reference: "SEPA incasso (deel)" },
            });
          } else {
            await prisma.payment.create({
              data: { rentChargeId: charge.id, amount, receivedAt: new Date(due.getFullYear(), due.getMonth(), 2 + (m % 4)), reference: "SEPA incasso" },
            });
          }
        }
        // else: no payment recorded → shows as LATE/MISSING for recent months
      }
    }

    // Issues — some raised by tenants, some by manager/owner.
    const issueSeeds = [
      { title: "Lekkage dak", raisedBy: "TENANT", category: "MAINTENANCE", priority: "HIGH", status: "OPEN", cost: 3500 },
      { title: "CV-ketel storing", raisedBy: "TENANT", category: "MAINTENANCE", priority: "MEDIUM", status: "IN_PROGRESS", cost: 850 },
      { title: "Huurachterstand aanmaning", raisedBy: "MANAGER", category: "PAYMENT", priority: "HIGH", status: "OPEN", cost: null },
      { title: "Schilderwerk gevel gepland", raisedBy: "OWNER", category: "MAINTENANCE", priority: "LOW", status: "OPEN", cost: 12000 },
      { title: "Vergunning verbouwing", raisedBy: "OWNER", category: "LEGAL", priority: "MEDIUM", status: "RESOLVED", cost: 2200 },
    ];
    const nIssues = (templates.indexOf(t) % 3); // 0..2 issues per property
    for (let i = 0; i < nIssues; i++) {
      const s = issueSeeds[(templates.indexOf(t) + i) % issueSeeds.length];
      await prisma.issue.create({
        data: {
          propertyId: property.id, title: s.title, raisedBy: s.raisedBy, category: s.category,
          priority: s.priority, status: s.status, cost: s.cost ?? undefined,
          description: `${s.title} — gemeld voor ${t.name}.`,
          createdAt: addMonths(today, -(i + 1)),
        },
      });
    }
  }

  // --- Projects (redevelopment) ---
  const devProps = await prisma.property.findMany({ where: { status: "IN_DEVELOPMENT" } });
  for (const p of devProps) {
    await prisma.project.create({
      data: {
        propertyId: p.id,
        name: `Herontwikkeling ${p.name}`,
        description: "Transformatie naar nieuwe bestemming.",
        status: "IN_PROGRESS",
        budget: Math.round((p.wozValue ?? 1000000) * 0.4),
        spent: Math.round((p.wozValue ?? 1000000) * 0.15),
        startDate: addMonths(new Date(), -4),
        targetDate: addMonths(new Date(), 10),
      },
    });
  }
  await prisma.project.create({
    data: {
      name: "Verduurzaming portefeuille (label C→A)",
      description: "Energetische verbetering van kantoorpanden, incl. zonnepanelen.",
      status: "PLANNING",
      budget: 480000, spent: 60000,
      startDate: addMonths(new Date(), -1), targetDate: addMonths(new Date(), 18),
    },
  });

  const counts = {
    entities: await prisma.legalEntity.count(),
    properties: await prisma.property.count(),
    units: await prisma.unit.count(),
    leases: await prisma.lease.count(),
    charges: await prisma.rentCharge.count(),
    payments: await prisma.payment.count(),
    issues: await prisma.issue.count(),
    projects: await prisma.project.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
