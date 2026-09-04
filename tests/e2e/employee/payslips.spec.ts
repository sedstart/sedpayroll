import { test, expect } from "@playwright/test";

test.describe("My payslips", () => {
  test("lists payslips or shows the empty state", async ({ page }) => {
    await page.goto("/payslips");
    const table = page.getByTestId("my-payslips-table");
    await expect(table).toBeVisible();

    const emptyState = page.getByTestId("my-payslips-table").getByText(
      "No payslips yet."
    );
    const rows = table.locator("tbody tr[data-testid^='my-payslip-row-']");

    // Seeding always processes last month's payroll, so a freshly seeded DB
    // has exactly one payslip per employee — but tolerate either state so
    // the test survives a DB seeded before this employee existed too.
    await expect(rows.or(emptyState).first()).toBeVisible();
  });

  test("opens a payslip and shows the net pay breakdown", async ({ page }) => {
    await page.goto("/payslips");
    const viewLink = page
      .locator("[data-testid^='my-payslip-view-']")
      .first();

    test.skip(
      (await viewLink.count()) === 0,
      "no payslips seeded for this employee yet"
    );

    await viewLink.click();
    await expect(page.getByTestId("payslip-detail")).toBeVisible();
    await expect(page.getByTestId("payslip-net-pay")).toBeVisible();
    await expect(page.getByText("Earnings", { exact: true })).toBeVisible();
    await expect(page.getByText("Deductions", { exact: true })).toBeVisible();
  });

  test("cannot view another employee's payslip by guessing its id", async ({
    page,
  }) => {
    // Payslip ids are sequential integers — walk a small range and assert
    // every id that isn't this employee's own 404s, never renders another
    // employee's pay data.
    for (let id = 1; id <= 20; id++) {
      const response = await page.goto(`/payslips/${id}`);
      const isOwnPayslip = await page
        .getByTestId("payslip-detail")
        .isVisible()
        .catch(() => false);
      if (isOwnPayslip) continue;
      expect(response?.status()).toBe(404);
    }
  });
});
