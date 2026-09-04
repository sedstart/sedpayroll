# SedPayroll

A Keka-style payroll, attendance and employee management app built with Next.js
(App Router), Drizzle ORM, Postgres and Auth.js. One shared portal for
everyone — admin is just a role flag on an employee's own login that unlocks
a few extra sections (Employees, Team Attendance, Payroll).

## Stack

- Next.js 16 (App Router, Server Actions, Turbopack)
- Postgres — Docker locally, [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) in production
- Drizzle ORM (`postgres-js` driver)
- Auth.js v5 (Credentials provider, JWT sessions)
- Tailwind CSS + shadcn/ui
- bun

## Local development

```bash
cp .env.example .env.local        # fill in AUTH_SECRET (see below)
bun install
bun run docker:up                 # starts local Postgres (docker-compose.yml)
bun run db:migrate                # applies drizzle/ migrations
bun run db:seed                   # seeds departments, employees, attendance, payroll
bun run dev
```

Open http://localhost:3000. Demo logins (from the seed script):

- Admin: `neha.iyer@sedpayroll.com` / `Admin@123` (also `sanya.kapoor@sedpayroll.com`)
- Employee: `aditi.sharma@sedpayroll.com` / `Employee@123` (see `db/seed.ts` for the full list)

Other useful scripts: `bun run db:generate` (new migration after a schema
change), `bun run db:studio` (Drizzle Studio), `bun run docker:down`.

## Environment variables

| Variable | Required where | Notes |
| --- | --- | --- |
| `DB_DATABASE_URL` | always | Standard Postgres connection string. Local: matches `docker-compose.yml`. Production: your Vercel Postgres connection string. |
| `AUTH_SECRET` | always | Generate with `bunx auth secret` or `openssl rand -base64 33`. |
| `AUTH_URL` | optional, local dev only | Not needed on Vercel — `lib/auth.config.ts` sets `trustHost: true`, so Auth.js reads the real host from request headers (works for production and every preview URL). |

## Deploying to Vercel

1. Create a [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   store and connect it to the project. Copy its connection string into a
   `DB_DATABASE_URL` project environment variable (Vercel's own `POSTGRES_URL`
   var is not read directly — map it over).
2. Set `AUTH_SECRET` as a project environment variable. Do **not** set
   `AUTH_URL` unless you want to pin a single fixed domain — leaving it unset
   lets preview deployments authenticate correctly too.
3. Run migrations and seed against the production database once, e.g. from
   your machine with `DB_DATABASE_URL` pointed at the Vercel Postgres
   connection string:

   ```bash
   DB_DATABASE_URL="<vercel-postgres-url>" bun run db:migrate
   DB_DATABASE_URL="<vercel-postgres-url>" bun run db:seed   # optional, for demo data
   ```

4. Deploy. `bun run build` runs as the Vercel build command automatically.
