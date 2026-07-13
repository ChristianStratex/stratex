# StrateX — Commercial Real Estate Portfolio Dashboard

A dashboard for a commercial real-estate owner to track an entire portfolio in one
place: **properties, tenants, rent, late payments, issues, redevelopment projects**, and
the **tax structure** (personal vs. BV) — built to stay fast at hundreds of units.

Bilingual **Dutch / English**, EUR-native, designed around Dutch tax reality
(Box 3 → *werkelijk rendement*, Vpb/Box 2, overdrachtsbelasting).

> ⚠️ All seed data is **fictional demo data**. No real person's holdings are represented.
> Real portfolios load from authoritative sources (KvK, Kadaster) or the owner's team.

## Features

- **Portfolio dashboard** — KPI header (total WOZ value, monthly income/cost, net cashflow,
  arrears, occupancy, open issues, expiring leases), an interactive map colour-coded by
  property health, and entity/type breakdown charts.
- **Property table & detail** — per property: name/location, WOZ-waarde, purchase price,
  monthly rent, monthly cost, net cashflow, yield, occupancy, **late payments per renter**,
  **open issues**, leases, valuation trend, and mortgage.
- **Arrears board** — outstanding/late rent by tenant with aging buckets (0-30/31-60/61-90/90+).
- **Bank reconciliation** — paste any bank's CSV export; transactions auto-match to open
  rent charges (amount + tenant-name + period heuristics, confidence-scored) and apply as
  payments. The same engine will consume the PSD2 bank feed later.
- **Issues / maintenance tracker** — tickets raised by tenant, manager or owner.
- **Projects** — redevelopment budget vs. spend and timeline.
- **Tax-structure planner** — interactive personal (Box 3) vs. BV (Vpb + Box 2) scenario
  model with transfer-tax entry cost and a multi-year break-even chart. *Informational, not
  tax advice.*

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** for styling
- **Prisma** ORM — **SQLite** for local dev/demo, **PostgreSQL** (EU region) for production
- **Recharts** (charts) + **React-Leaflet** (map)
- Lightweight cookie-based **NL/EN** i18n

## Getting started

```bash
npm install            # installs deps and runs `prisma generate`
npm run db:reset       # creates the SQLite schema and loads demo data
npm run dev            # http://localhost:3000
```

Other scripts:

```bash
npm run build          # production build
npm run start          # run the production build
npm run db:seed        # reseed demo data (13 properties)
npm run db:seed:large  # 300-property scale demo
npm run db:studio      # browse the database (Prisma Studio)
npm test               # run unit tests (tax + arrears logic)
```

## Project structure

```
prisma/
  schema.prisma        # data model (entities, properties, leases, charges, issues, …)
  seed.ts              # fictional demo portfolio
src/
  app/                 # routes: dashboard, properties, arrears, issues, projects, tax
  components/          # UI (table, map, charts, badges, tax calculator, …)
  lib/
    queries.ts         # aggregation layer (per-property stats, KPIs, arrears)
    tax.ts             # personal-vs-BV scenario calculator (parameterized rates)
    format.ts          # EUR / date / % formatting
    enums.ts           # value sets + bilingual labels
  i18n/                # NL/EN dictionaries + locale helper
```

## Also included

- **Authentication & RBAC** — password login (scrypt + signed HMAC sessions, middleware
  gating), roles: owner / manager / accountant / assistant / viewer / tenant. Demo
  accounts on the login page (password `demo2026`).
- **Tenant portal** — tenants log in and see only their own leases, charge/payment
  history and issues, and can submit new issues (server-verified to their own
  properties). Staff and tenants are isolated both ways in the middleware.
- **Alerts center** — severity-ranked action list (arrears scale with amount, expiries
  with proximity) + high-priority tenant issues.
- **Rent indexation** — CPI-based proposals per lease with batch apply; rents, review
  dates and audit stamps updated automatically.
- **Monthly charge generation** — idempotent generator for each month's rent charges
  (staff button on Bank & collection, or `/api/cron/generate-charges` with
  `Authorization: Bearer $CRON_SECRET` for a scheduler).
- **Documents** — leases/deeds/permits per property (10 MB, RBAC-gated, authenticated
  downloads).
- **Per-entity P&L report** + CSV exports; **weekly digest** preview at `/api/digest`.
- **Scale**: `npm run db:seed:large` loads a 300-property portfolio; dashboard renders
  in ~0.4 s.

## Roadmap (next)

1. **GoCardless (PSD2) bank feed** — automatic nightly transaction sync into the
   existing reconciliation engine; optional Exact Online accounting sync.
2. **Email delivery** — send the digest and alerts via Resend/Postmark.
3. **CBS CPI feed** — auto-fill the indexation percentage.
4. **PostgreSQL (EU) + object storage** for production; audit log; backups.

## Tax notes

Rates live in `src/lib/tax.ts` and reflect **2026** figures. The Box 3 reform
(*Wet werkelijk rendement*, targeted 2028) is not yet final — rates are parameterized so
they can be updated. This module is **informational only and not tax advice**.
