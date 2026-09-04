import { test, expect } from "@playwright/test";
import { EMPLOYEE_USER } from "../../support/credentials";

test.describe("My profile", () => {
  test("shows the employee's own details, read-only", async ({ page }) => {
    await page.goto("/profile");
    const details = page.getByTestId("employee-profile-details");
    await expect(details).toBeVisible();
    await expect(details).toContainText(
      `${EMPLOYEE_USER.firstName} ${EMPLOYEE_USER.lastName}`
    );
    await expect(details).toContainText(EMPLOYEE_USER.email);
    // Read-only page — no editable form controls (the sign-out form in the
    // app shell does render a hidden Server Action input on every page, so
    // exclude hidden inputs rather than asserting zero inputs of any kind).
    await expect(
      page.locator("input:not([type=hidden]), textarea, select")
    ).toHaveCount(0);
  });
});
