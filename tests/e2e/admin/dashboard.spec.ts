import { test, expect } from "@playwright/test";
import { ADMIN_USER } from "../../support/credentials";

test.describe("Dashboard (admin)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows the clock widget, latest payslip card, and org overview", async ({
    page,
  }) => {
    await expect(page.getByTestId("clock-widget")).toBeVisible();
    await expect(page.getByTestId("latest-payslip-card")).toBeVisible();
    await expect(page.getByTestId("organization-overview")).toBeVisible();
  });

  test("org overview stat cards link to their respective sections", async ({
    page,
  }) => {
    const overview = page.getByTestId("organization-overview");
    await expect(
      overview.getByText("Active employees", { exact: true })
    ).toBeVisible();
    await expect(overview.getByText("Present today")).toBeVisible();
    await expect(
      overview.getByText("Payroll runs", { exact: true })
    ).toBeVisible();
    await expect(overview.getByText("Inactive employees")).toBeVisible();

    await overview.getByText("Active employees", { exact: true }).click();
    await expect(page).toHaveURL("/employees");
  });

  test("sidebar exposes every admin nav item", async ({ page }) => {
    await expect(page.getByTestId("current-user-email")).toHaveText(
      ADMIN_USER.email
    );
    await expect(
      page.getByTestId("sidebar").getByText("Administrator", { exact: true })
    ).toBeVisible();
    const sidebar = page.getByTestId("sidebar-nav");
    for (const testId of [
      "nav-link-dashboard",
      "nav-link-my-attendance",
      "nav-link-my-payslips",
      "nav-link-profile",
      "nav-link-employees",
      "nav-link-team-attendance",
      "nav-link-payroll",
    ]) {
      await expect(sidebar.getByTestId(testId)).toBeVisible();
    }
  });
});
