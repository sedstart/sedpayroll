/**
 * Runs once after the entire suite finishes (all projects, pass or fail —
 * see playwright.config.ts's `globalTeardown`), hard-deleting everything the
 * suite itself created so a subsequent run starts from the same state as a
 * fresh `bun run db:seed`, without needing to actually reseed.
 */
import {
  ADMIN_USER,
  EMPLOYEE_USER,
  SECONDARY_ADMIN_USER,
  SECONDARY_EMPLOYEE_USER,
} from "../support/credentials";
import {
  closeTeardownDb,
  hardDeleteAttendanceToday,
  hardDeletePayrollRun,
  hardDeleteTestEmployees,
} from "../support/db-teardown";

export default async function globalTeardown() {
  const now = new Date();

  const [deletedEmployees, deletedPayrollRun] = await Promise.all([
    hardDeleteTestEmployees(),
    hardDeletePayrollRun(now.getMonth() + 1, now.getFullYear()),
    ...[ADMIN_USER, SECONDARY_ADMIN_USER, EMPLOYEE_USER, SECONDARY_EMPLOYEE_USER].map(
      (user) => hardDeleteAttendanceToday(user.email)
    ),
  ]);

  console.log(
    `[global.teardown] removed ${deletedEmployees.length} disposable employee(s)` +
      (deletedPayrollRun.length
        ? `, ${deletedPayrollRun.length} current-month payroll run`
        : "")
  );

  await closeTeardownDb();
}
