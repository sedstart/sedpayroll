/**
 * Hard-delete helpers for test teardown.
 *
 * These talk to Postgres directly (same pattern as db/seed.ts) rather than
 * through an HTTP route on the app itself — a delete-everything capability
 * is not something worth shipping as a reachable endpoint on a payroll app,
 * even behind an env-var gate: it's one misconfigured deploy away from being
 * live in production. Since Playwright's test process is plain Node and
 * already has DB_DATABASE_URL available (.env.local), talking to the
 * database directly gets the same "clean up after every test run" outcome
 * with zero extra attack surface on the shipped app.
 *
 * Deletes here are real hard deletes (not the app's soft-delete "inactive"
 * status) and rely on the schema's `onDelete: "cascade"` FKs (db/schema.ts)
 * to remove dependent rows: deleting an employee also removes their user
 * login, attendance history, salary structures, and payslips; deleting a
 * payroll run also removes its payslips.
 */
import { config } from "dotenv";
import path from "node:path";
config({ path: path.join(__dirname, "../../.env.local") });

import { and, eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../db/schema";

type TeardownDb = ReturnType<typeof drizzle<typeof schema>>;

let client: postgres.Sql | null = null;
let db: TeardownDb | null = null;

function getDb(): TeardownDb {
  if (!db) {
    if (!process.env.DB_DATABASE_URL) {
      throw new Error(
        "DB_DATABASE_URL is not set — copy .env.example to .env.local first (see tests/README.md)."
      );
    }
    client = postgres(process.env.DB_DATABASE_URL, { prepare: false, max: 3 });
    db = drizzle(client, { schema });
  }
  return db;
}

/**
 * Hard-deletes every employee whose email starts with the given prefix —
 * matches the disposable fixtures tests/support/helpers.ts's
 * uniqueEmployee() creates (`test.employee.<timestamp>@sedpayroll.com`).
 * Cascades to their login, attendance, salary structures, and payslips.
 */
export async function hardDeleteTestEmployees(emailPrefix = "test.employee.") {
  return getDb()
    .delete(schema.employees)
    .where(like(schema.employees.email, `${emailPrefix}%`))
    .returning({ id: schema.employees.id, email: schema.employees.email });
}

/**
 * Hard-deletes the payroll run (and its payslips) for a given month/year, if
 * one exists — lets tests/e2e/admin/payroll.spec.ts's "run payroll for the
 * current month" test leave no trace instead of depending on a reseed
 * before the next run.
 */
export async function hardDeletePayrollRun(month: number, year: number) {
  return getDb()
    .delete(schema.payrollRuns)
    .where(and(eq(schema.payrollRuns.month, month), eq(schema.payrollRuns.year, year)))
    .returning({ id: schema.payrollRuns.id });
}

/**
 * Hard-deletes today's attendance row for the given employee email, if any
 * — lets clock-in/out tests reset to a genuinely clean "not clocked in"
 * state instead of branching on whatever state a previous run left behind.
 */
export async function hardDeleteAttendanceToday(employeeEmail: string) {
  const database = getDb();
  const [employee] = await database
    .select({ id: schema.employees.id })
    .from(schema.employees)
    .where(eq(schema.employees.email, employeeEmail))
    .limit(1);
  if (!employee) return [];

  const today = new Date().toISOString().slice(0, 10);
  return database
    .delete(schema.attendance)
    .where(
      and(eq(schema.attendance.employeeId, employee.id), eq(schema.attendance.date, today))
    )
    .returning({ id: schema.attendance.id });
}

/** Closes the teardown module's own DB connection. Call once, at the very
 * end of the run (see tests/e2e/global.teardown.ts) — otherwise the
 * Playwright process can hang waiting for the open Postgres socket. */
export async function closeTeardownDb() {
  if (client) {
    await client.end({ timeout: 1 });
    client = null;
    db = null;
  }
}
