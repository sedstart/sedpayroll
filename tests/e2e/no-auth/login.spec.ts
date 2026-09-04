import { test, expect } from "@playwright/test";
import {
  ADMIN_USER,
  EMPLOYEE_USER,
  INVALID_USER,
} from "../../support/credentials";
import { login, expectAuthenticated } from "../../support/helpers";

// This project runs with no storageState (see playwright.config.ts), so
// every test here starts as a fresh, unauthenticated visitor.

test.describe("Login", () => {
  test("renders the login form with demo credential hints", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByTestId("login-form")).toBeVisible();
    await expect(page.getByTestId("login-email-input")).toBeVisible();
    await expect(page.getByTestId("login-password-input")).toBeVisible();
    await expect(page.getByText(ADMIN_USER.email)).toBeVisible();
    await expect(page.getByText(EMPLOYEE_USER.email)).toBeVisible();
  });

  test("admin can sign in and lands on the dashboard", async ({ page }) => {
    await login(page, ADMIN_USER.email, ADMIN_USER.password);
    await expect(page).toHaveURL("/");
    await expectAuthenticated(page);
    await expect(page.getByTestId("current-user-email")).toHaveText(
      ADMIN_USER.email
    );
    // Admin-only nav items are visible. Scoped to the desktop sidebar since
    // the same links are also duplicated (hidden via CSS) in the mobile nav.
    const sidebar = page.getByTestId("sidebar-nav");
    await expect(sidebar.getByTestId("nav-link-employees")).toBeVisible();
    await expect(sidebar.getByTestId("nav-link-payroll")).toBeVisible();
  });

  test("employee can sign in and does not see admin nav items", async ({
    page,
  }) => {
    await login(page, EMPLOYEE_USER.email, EMPLOYEE_USER.password);
    await expect(page).toHaveURL("/");
    await expectAuthenticated(page);
    await expect(page.getByTestId("nav-link-employees")).toHaveCount(0);
    await expect(page.getByTestId("nav-link-payroll")).toHaveCount(0);
    await expect(page.getByTestId("nav-link-team-attendance")).toHaveCount(0);
  });

  test("shows an error for a wrong password and stays on /login", async ({
    page,
  }) => {
    await login(page, ADMIN_USER.email, INVALID_USER.password);
    await expect(page).toHaveURL("/login");
    await expect(page.getByTestId("login-error")).toHaveText(
      "Invalid email or password."
    );
  });

  test("shows an error for an unknown email", async ({ page }) => {
    await login(page, INVALID_USER.email, INVALID_USER.password);
    await expect(page).toHaveURL("/login");
    await expect(page.getByTestId("login-error")).toBeVisible();
  });

  test("blocks submission of an empty form via native required validation", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByTestId("login-submit-button").click();
    // Still on /login — the native `required` attributes prevented submit.
    await expect(page).toHaveURL("/login");
  });

  test("rejects a syntactically invalid email", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("login-email-input").fill("not-an-email");
    await page.getByTestId("login-password-input").fill("whatever");
    await page.getByTestId("login-submit-button").click();
    // type="email" native validation blocks submission client-side.
    await expect(page).toHaveURL("/login");
  });
});

test.describe("Route protection while signed out", () => {
  for (const path of [
    "/",
    "/attendance",
    "/payslips",
    "/profile",
    "/employees",
    "/employees/new",
    "/team-attendance",
    "/payroll",
  ]) {
    test(`GET ${path} redirects to /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
