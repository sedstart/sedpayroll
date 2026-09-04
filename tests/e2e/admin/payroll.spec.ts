import { test, expect } from "@playwright/test";
import { selectOption } from "../../support/helpers";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

test.describe("Payroll runs list", () => {
  test("shows the run-payroll form and past runs", async ({ page }) => {
    await page.goto("/payroll");
    await expect(page.getByTestId("run-payroll-form")).toBeVisible();
    await expect(page.getByTestId("payroll-runs-table")).toBeVisible();
    // Seeding always processes last month's payroll.
    const rows = page
      .getByTestId("payroll-runs-table")
      .locator("tbody tr[data-testid^='payroll-run-row-']");
    await expect(rows.first()).toBeVisible();
  });
});

test.describe("Run payroll", () => {
  test("running payroll for the current month redirects to its detail page, or reports it was already run", async ({
    page,
  }) => {
    const now = new Date();
    await page.goto("/payroll");

    await selectOption(page, "payroll-month-select", MONTH_NAMES[now.getMonth()]);
    await selectOption(page, "payroll-year-select", String(now.getFullYear()));
    await page.getByTestId("run-payroll-submit").click();

    // On a freshly seeded DB this is the first run for the current month and
    // succeeds (redirecting to /payroll/{id}); running the suite again the
    // same month without reseeding hits the duplicate-run guard instead
    // (same URL, error banner). Race the two outcomes rather than a one-shot
    // check — both take a server round trip, so neither is available
    // immediately after the click.
    const runError = page.getByTestId("run-payroll-error");
    const outcome = await Promise.race([
      page.waitForURL(/\/payroll\/\d+$/, { timeout: 10_000 }).then(() => "success" as const),
      runError.waitFor({ state: "visible", timeout: 10_000 }).then(() => "error" as const),
    ]);

    if (outcome === "error") {
      await expect(runError).toHaveText(
        "Payroll for this month has already been run."
      );
      return;
    }

    await expect(page).toHaveURL(/\/payroll\/\d+$/);
    await expect(page.getByTestId("payroll-run-status")).toHaveText(
      "processed"
    );
    await expect(page.getByTestId("payslips-table")).toBeVisible();
    await expect(page.getByTestId("mark-payroll-paid-button")).toBeVisible();
  });

  test("rejects running payroll for a month that was already processed", async ({
    page,
  }) => {
    await page.goto("/payroll");
    // Seeding always processes last month — running it again must fail.
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    await selectOption(
      page,
      "payroll-month-select",
      MONTH_NAMES[lastMonth.getMonth()]
    );
    await selectOption(
      page,
      "payroll-year-select",
      String(lastMonth.getFullYear())
    );
    await page.getByTestId("run-payroll-submit").click();

    await expect(page.getByTestId("run-payroll-error")).toHaveText(
      "Payroll for this month has already been run."
    );
    await expect(page).toHaveURL("/payroll");
  });
});

test.describe("Payroll run detail", () => {
  test("opening a run from the list shows its payslips and totals", async ({
    page,
  }) => {
    await page.goto("/payroll");
    await page
      .locator("[data-testid^='payroll-run-view-']")
      .first()
      .click();

    await expect(page.getByTestId("payroll-run-status")).toBeVisible();
    await expect(page.getByTestId("payslips-table")).toBeVisible();
    const rows = page
      .getByTestId("payslips-table")
      .locator("tbody tr[data-testid^='payslip-row-']");
    await expect(rows.first()).toBeVisible();
  });

  test("marking a processed run as paid updates its status and hides the action", async ({
    page,
  }) => {
    await page.goto("/payroll");
    const processedRow = page
      .getByTestId("payroll-runs-table")
      .locator("tbody tr", { hasText: "Processed" });

    test.skip(
      (await processedRow.count()) === 0,
      "no processed (unpaid) payroll run available to mark as paid"
    );

    await processedRow
      .first()
      .locator("[data-testid^='payroll-run-view-']")
      .click();

    await expect(page.getByTestId("payroll-run-status")).toHaveText(
      "processed"
    );
    await page.getByTestId("mark-payroll-paid-button").click();

    await expect(page.getByTestId("payroll-run-status")).toHaveText("paid");
    await expect(page.getByTestId("mark-payroll-paid-button")).toHaveCount(0);
  });

  test("visiting a non-existent payroll run returns 404", async ({ page }) => {
    const response = await page.goto("/payroll/999999");
    expect(response?.status()).toBe(404);
  });
});
