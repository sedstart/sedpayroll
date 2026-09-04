# E2E tests (Playwright)

End-to-end tests that drive the real app in a browser against a real local
Postgres database — no mocking. They exercise the app the way a user
actually would: signing in, clocking in/out, running payroll, managing
employees, etc.

## One-time setup

```bash
cp .env.example .env.local        # fill in AUTH_SECRET, see README.md
bun install
bunx playwright install --with-deps   # downloads browser binaries (already done in this repo's dev container)
bun run docker:up                 # starts local Postgres
bun run db:migrate
bun run db:seed                   # required — tests log in with the seeded demo accounts
```

## Running

```bash
bun run test:e2e            # headless, all projects
bun run test:e2e:headed     # same, with visible browser windows
bun run test:e2e:ui         # Playwright's interactive UI mode (recommended while writing tests)
bun run test:e2e:report     # open the HTML report from the last run
```

`playwright.config.ts` starts `bun run dev` automatically if nothing is
already listening on port 3000 (`reuseExistingServer` is on outside CI), so
you don't need to start the dev server yourself first — though doing so
(and leaving it running) makes repeat runs faster.

## Structure

```
tests/
  e2e/
    global.setup.ts     # logs in as the seeded admin + employee once, saves
                         # each session to tests/.auth/*.json
    no-auth/            # login page + "redirects to /login" route guards
    admin/              # employees, payroll, team attendance, admin dashboard
    employee/           # self-service dashboard, attendance, payslips, profile,
                         # and "admin routes redirect me to /" RBAC checks
  support/
    credentials.ts      # seeded demo accounts (db/seed.ts)
    helpers.ts           # login(), pickToday() (custom DatePicker), selectOption()
                         # (Base UI Select), uniqueEmployee()
```

Playwright projects (`playwright.config.ts`) map onto those folders:
`setup` runs once, then `admin` and `employee` reuse its saved
`storageState` (cookies) so every other spec starts already signed in as
the right role — no `no-auth` test relies on `storageState`.

## Data notes — read before adding tests

The suite runs against the seeded dataset (`bun run db:seed`), which is
**destructive** (it wipes and re-creates all tables) and **not fully
deterministic** — attendance history is randomized, and "today" is
intentionally never pre-seeded. Tests are written to tolerate this:

- Tests that mutate shared data (create an employee, run payroll for a
  month) either create disposable fixtures with a unique, timestamped email
  (`uniqueEmployee()`), or accept either possible outcome of a
  run-once action (e.g. running current-month payroll either succeeds the
  first time or reports "already run" on a repeat run) rather than assuming
  a pristine database.
- Tests do not assume specific employee/payroll-run **ids** — those shift
  across reseeds — and instead look rows up by email/text.
- The admin round-trip test in `admin/employees.spec.ts` restores the role
  it toggled so re-running the suite doesn't need a reseed in between.

For a fully clean run (e.g. before a release), reseed first:
`bun run db:seed && bun run test:e2e`.

## Test case inventory

`docs/SedPayroll-E2E-Test-Cases.xlsx` lists every test case covered here
(plus a handful of manual/exploratory cases not worth automating — see its
"Automated?" column) with steps, expected results, and priority. Regenerate
it after adding/removing cases with `python3 scripts/generate_test_cases_xlsx.py`.
