# Deploying StrateX to Vercel

StrateX runs on **PostgreSQL** (SQLite does not work on Vercel's serverless
filesystem). Any managed EU Postgres works — Vercel Postgres, Neon, or Supabase.

## 1. Create a Postgres database

- **Vercel Postgres**: Vercel dashboard → Storage → Create → Postgres (pick an EU
  region). It exposes a `DATABASE_URL` (use the pooled/`?pgbouncer=true` connection
  string for serverless).
- or **Neon** (https://neon.tech): create a project in an EU region, copy the
  pooled connection string.

## 2. Import the project into Vercel

- New Project → import the `stratex` repo → framework preset **Next.js** (auto).

## 3. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable        | Value                                                            |
| --------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`  | your Postgres pooled connection string                           |
| `AUTH_SECRET`   | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CRON_SECRET`   | any long random string (Vercel sends it as the cron Bearer token) |

Set them for Production (and Preview if you use it).

## 4. Create the schema and (optionally) seed

From your machine, pointed at the production database:

```bash
DATABASE_URL="<prod url>" npx prisma db push        # create tables
DATABASE_URL="<prod url>" npm run db:seed           # optional demo data
```

For real data, skip the seed and load the portfolio via the in-app CSV importer
(Properties → Import) or the Kadaster objectlijst.

> ⚠️ The seed is **fictional demo data**. Do not seed a production instance you
> intend to use with real tenants.

## 5. Deploy

Push to the deployed branch (or click Deploy). The build runs `prisma generate`
(via `postinstall`) and `next build`.

## 6. Cron

`vercel.json` schedules `/api/cron/generate-charges` monthly (06:00 on the 1st).
Vercel automatically sends `Authorization: Bearer $CRON_SECRET`, which the route
verifies. The weekly digest (`/api/digest`) can be wired to email via Resend/
Postmark later.

## First login

Demo accounts (if you seeded) use password `demo2026`:
`owner@example.nl`, `manager@example.nl`, `boekhouding@example.nl`,
`viewer@example.nl`, `huurder@example.nl`. **Change or remove these before real use.**

## Local development

Local dev also uses Postgres. Quickest option is Docker:

```bash
docker run --name stratex-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=stratex -p 5432:5432 -d postgres:16
# .env: DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stratex"
npm run db:reset   # push schema + seed
npm run dev
```
