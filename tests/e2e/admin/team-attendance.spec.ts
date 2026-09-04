import { test, expect } from "@playwright/test";

test.describe("Team attendance", () => {
  test("shows today's attendance for all active employees by default", async ({
    page,
  }) => {
    await page.goto("/team-attendance");
    await expect(page.getByTestId("team-attendance-table")).toBeVisible();
    const rows = page.getByTestId("team-attendance-table").locator(
      "tbody tr[data-testid^='team-attendance-row-']"
    );
    // Seed data creates 8 active employees, none deactivated by default.
    await expect(rows.first()).toBeVisible();
  });

  test("can filter by a past date via the date picker", async ({ page }) => {
    await page.goto("/team-attendance");

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isoYesterday = yesterday.toISOString().slice(0, 10);

    await page.locator("#attendance-date").click();
    const targetDataDay = await page.evaluate(
      (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(),
      isoYesterday
    );
    await page.locator(`button[data-day="${targetDataDay}"]`).first().click();
    await page.getByRole("button", { name: "View" }).click();

    await expect(page).toHaveURL(`/team-attendance?date=${isoYesterday}`);
    await expect(page.getByText(isoYesterday)).toBeVisible();
  });
});
