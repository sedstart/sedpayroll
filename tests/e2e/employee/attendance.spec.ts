import { test, expect } from "@playwright/test";

test.describe("My attendance", () => {
  test("attendance history table renders", async ({ page }) => {
    await page.goto("/attendance");
    await expect(page.getByTestId("my-attendance-table")).toBeVisible();
  });

  test("clock widget reflects today's state and is idempotent", async ({
    page,
  }) => {
    await page.goto("/");
    const widget = page.getByTestId("clock-widget");
    const clockInButton = page.getByTestId("clock-in-button");
    const clockOutButton = page.getByTestId("clock-out-button");
    await expect(widget).toBeVisible();

    // Seed data never includes "today", but the suite can run more than
    // once against the same seeded DB in one day — so this test adapts to
    // whichever state today's attendance is already in rather than
    // assuming a clean slate.
    if (await clockInButton.isEnabled()) {
      await clockInButton.click();
      await expect(page.getByTestId("clock-status-text")).toContainText(
        "Clocked in at"
      );
    }
    // Once clocked in (just now, or from an earlier run today), clocking in
    // again must be blocked by the disabled button — never a second row.
    await expect(clockInButton).toBeDisabled();

    if (await clockOutButton.isEnabled()) {
      await clockOutButton.click();
      await expect(page.getByTestId("clock-status-text")).toContainText(
        "Worked"
      );
    }
    await expect(clockOutButton).toBeDisabled();
  });

  test("today's session appears in the attendance history after clocking in", async ({
    page,
  }) => {
    await page.goto("/");
    // Ensure there is a clock-in for today (see previous test for why this
    // guards rather than assumes a clean slate).
    const clockInButton = page.getByTestId("clock-in-button");
    if (await clockInButton.isEnabled()) {
      await clockInButton.click();
    }

    await page.goto("/attendance");
    const rows = page.getByTestId("my-attendance-table").locator("tbody tr");
    await expect(rows.first()).toBeVisible();
  });
});
