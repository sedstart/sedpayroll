import { test, expect } from "@playwright/test";
import { EMPLOYEE_USER } from "../../support/credentials";

test.describe("Dashboard (employee)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows the clock widget and latest payslip card", async ({ page }) => {
    await expect(page.getByTestId("clock-widget")).toBeVisible();
    await expect(page.getByTestId("latest-payslip-card")).toBeVisible();
  });

  test("does not show the admin-only organization overview", async ({
    page,
  }) => {
    await expect(page.getByTestId("organization-overview")).toHaveCount(0);
  });

  test("sidebar shows the signed-in employee's email and role", async ({
    page,
  }) => {
    await expect(page.getByTestId("current-user-email")).toHaveText(
      EMPLOYEE_USER.email
    );
    await expect(page.getByText("Employee", { exact: true })).toBeVisible();
  });

  test("employee nav is limited to self-service sections", async ({
    page,
  }) => {
    const sidebar = page.getByTestId("sidebar-nav");
    await expect(sidebar.getByTestId("nav-link-dashboard")).toBeVisible();
    await expect(sidebar.getByTestId("nav-link-my-attendance")).toBeVisible();
    await expect(sidebar.getByTestId("nav-link-my-payslips")).toBeVisible();
    await expect(sidebar.getByTestId("nav-link-profile")).toBeVisible();
    // Admin-only links aren't rendered at all for an employee (not just
    // hidden), so this is unambiguous even though the sidebar is duplicated
    // for the mobile nav elsewhere.
    await expect(page.getByTestId("nav-link-employees")).toHaveCount(0);
    await expect(page.getByTestId("nav-link-payroll")).toHaveCount(0);
    await expect(page.getByTestId("nav-link-team-attendance")).toHaveCount(0);
  });

  test("can sign out from the dashboard", async ({ page }) => {
    await page.getByTestId("sign-out-button").click();
    await expect(page).toHaveURL(/\/login/);
  });
});
