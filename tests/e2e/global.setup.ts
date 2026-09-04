import { test as setup, expect } from "@playwright/test";
import { STORAGE_STATE } from "../../playwright.config";
import { ADMIN_USER, EMPLOYEE_USER } from "../support/credentials";
import { login, expectAuthenticated } from "../support/helpers";

setup("authenticate as admin", async ({ page }) => {
  await login(page, ADMIN_USER.email, ADMIN_USER.password);
  await expect(page).toHaveURL("/");
  await expectAuthenticated(page);
  await page.context().storageState({ path: STORAGE_STATE.admin });
});

setup("authenticate as employee", async ({ page }) => {
  await login(page, EMPLOYEE_USER.email, EMPLOYEE_USER.password);
  await expect(page).toHaveURL("/");
  await expectAuthenticated(page);
  await page.context().storageState({ path: STORAGE_STATE.employee });
});
