import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const PORT = process.env.PORT ?? "3000";
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export const STORAGE_STATE = {
  admin: path.join(__dirname, "tests/.auth/admin.json"),
  employee: path.join(__dirname, "tests/.auth/employee.json"),
};

/**
 * E2E suite for the whole app. Structure:
 *   tests/e2e/no-auth/*   — login page, unauthenticated redirects (no session)
 *   tests/e2e/admin/*     — everything reachable only by an admin role
 *   tests/e2e/employee/*  — everything reachable by a plain employee
 *
 * Auth is done once per run in `global.setup.ts`, which logs in through the
 * real UI and saves each role's cookie jar to tests/.auth/*.json; the
 * "admin" and "employee" projects then reuse it via `storageState` instead
 * of re-logging-in in every test/spec.
 *
 * The suite runs against a real Postgres database (see README.md — docker
 * compose + drizzle migrate + db:seed), not a mock, so specs avoid
 * `fullyParallel` to keep shared/admin-only data (payroll runs, employee
 * roster) from racing across workers.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  // Hard-deletes everything the suite created (disposable employees, the
  // current-month payroll run, today's test-account attendance) once,
  // after every project finishes — see tests/e2e/global.teardown.ts and
  // tests/support/db-teardown.ts.
  globalTeardown: require.resolve("./tests/e2e/global.teardown.ts"),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless:false,
  },

  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
      use: { ...devices["Desktop Chrome"]},
    },
    {
      name: "no-auth",
      testDir: "./tests/e2e/no-auth",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "admin",
      testDir: "./tests/e2e/admin",
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE.admin },
      dependencies: ["setup"],
    },
    {
      name: "employee",
      testDir: "./tests/e2e/employee",
      use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE.employee },
      dependencies: ["setup"],
    },
  ],

  webServer: {
    command: "bun run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
