import { test, expect } from "@playwright/test";

/**
 * `ADMIN_ONLY_PREFIXES` in lib/auth.config.ts gates these three sections —
 * a logged-in non-admin is bounced to "/" (not "/login", since they *are*
 * authenticated), both via the edge proxy and the `requireAdmin()` guard on
 * the page/server-action itself.
 */
test.describe("Admin-only sections are hidden from an employee", () => {
  for (const path of [
    "/employees",
    "/employees/new",
    "/employees/1",
    "/team-attendance",
    "/payroll",
    "/payroll/1",
  ]) {
    test(`GET ${path} redirects to the dashboard`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL("/");
    });
  }
});
