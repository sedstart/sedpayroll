import { test, expect } from "@playwright/test";
import {
  ADMIN_USER,
  EMPLOYEE_USER,
  SECONDARY_ADMIN_USER,
} from "../../support/credentials";
import {
  fillRequiredEmployeeFields,
  pickToday,
  selectOption,
  uniqueEmployee,
} from "../../support/helpers";

// Note: every clickable "link" here (Add employee, Active/Inactive tabs,
// Edit) is a shadcn Button rendered via `render={<Link>}`, which stamps
// `role="button"` on the anchor — so these are all `getByRole("button", …)`,
// not `getByRole("link", …)`, despite being real navigable <a> tags.

test.describe("Employee list", () => {
  test("lists active employees by default", async ({ page }) => {
    await page.goto("/employees");
    await expect(page.getByTestId("employee-table")).toBeVisible();
    await expect(
      page.getByTestId("employee-table").getByText(EMPLOYEE_USER.email)
    ).toBeVisible();
  });

  test("Active/Inactive tabs filter the roster", async ({ page }) => {
    await page.goto("/employees");
    await page.getByRole("button", { name: "Inactive", exact: true }).click();
    await expect(page).toHaveURL("/employees?status=inactive");
    // No inactive employees in a fresh seed.
    await expect(page.getByTestId("employee-table-empty")).toBeVisible();

    await page.getByRole("button", { name: "Active", exact: true }).click();
    await expect(page).toHaveURL("/employees?status=active");
    await expect(page.getByTestId("employee-table")).toBeVisible();
  });
});

test.describe("Create employee", () => {
  test("rejects an empty form with field-level errors", async ({ page }) => {
    await page.goto("/employees/new");
    await page.getByTestId("employee-form-submit").click();
    await expect(page.getByTestId("employee-form-error")).toHaveText(
      "Please fix the highlighted fields."
    );
    await expect(page.locator("#firstName-error")).toBeVisible();
    await expect(page.locator("#lastName-error")).toBeVisible();
    await expect(page.locator("#email-error")).toBeVisible();
    await expect(page.locator("#dateOfJoining-error")).toBeVisible();
    // Still on the create page — no employee was inserted.
    await expect(page).toHaveURL("/employees/new");
  });

  test("rejects a duplicate email", async ({ page }) => {
    await page.goto("/employees/new");
    await fillRequiredEmployeeFields(page, {
      firstName: "Dup",
      lastName: "Licate",
      email: EMPLOYEE_USER.email,
    });
    await page.getByTestId("employee-form-submit").click();

    await expect(page.getByTestId("employee-form-error")).toHaveText(
      "An account with this email already exists."
    );
    await expect(page.locator("#email-error")).toHaveText(
      "Email already in use"
    );
    await expect(page).toHaveURL("/employees/new");
  });

  test("creates a new employee and shows the temporary-password banner", async ({
    page,
  }) => {
    const employee = uniqueEmployee();

    await page.goto("/employees/new");
    await page.getByTestId("employee-firstName-input").fill(employee.firstName);
    await page.getByTestId("employee-lastName-input").fill(employee.lastName);
    await page.getByTestId("employee-email-input").fill(employee.email);
    await selectOption(page, "employee-gender-select", "Female");
    await selectOption(page, "employee-department-select", "Engineering");
    await selectOption(
      page,
      "employee-designation-select",
      "Software Engineer"
    );
    await pickToday(page, "dateOfJoining");
    await page.getByTestId("employee-basic-input").fill("50000");
    await page.getByTestId("employee-hra-input").fill("20000");

    await page.getByTestId("employee-form-submit").click();

    // Redirects to /employees/{id}?created=1 — id is unknown ahead of time.
    await expect(page).toHaveURL(/\/employees\/\d+\?created=1/);
    await expect(page.getByText("Employee created")).toBeVisible();
    await expect(page.getByText(employee.email, { exact: true })).toBeVisible();
    await expect(page.getByText("Employee@123")).toBeVisible();

    // New hire shows up in the active roster.
    await page.goto("/employees");
    await expect(
      page.getByTestId("employee-table").getByText(employee.email)
    ).toBeVisible();
  });

  test("creating with the admin checkbox grants the admin role and an Admin@123 temp password", async ({
    page,
  }) => {
    const employee = uniqueEmployee();

    await page.goto("/employees/new");
    await fillRequiredEmployeeFields(page, employee, "40000");
    await page.getByTestId("employee-isAdmin-checkbox").click();

    await page.getByTestId("employee-form-submit").click();

    await expect(page).toHaveURL(/\/employees\/\d+\?created=1/);
    await expect(page.getByText("Admin@123")).toBeVisible();
    await expect(page.getByTestId("employee-current-role")).toHaveText(
      "Administrator"
    );
  });
});

test.describe("Edit employee", () => {
  test("updates an employee's details", async ({ page }) => {
    // Create a disposable employee to edit, rather than mutating a seeded
    // fixture other specs rely on.
    const employee = uniqueEmployee();
    await page.goto("/employees/new");
    await fillRequiredEmployeeFields(page, employee);
    await page.getByTestId("employee-form-submit").click();
    await expect(page).toHaveURL(/\/employees\/(\d+)\?created=1/);

    await page.getByTestId("employee-phone-input").fill("9876543210");
    await page.getByTestId("employee-form-submit").click();

    await expect(page.getByTestId("employee-form")).toBeVisible();
    await expect(page.getByTestId("employee-phone-input")).toHaveValue(
      "9876543210"
    );
  });

  test("deactivating then reactivating an employee toggles their status", async ({
    page,
  }) => {
    const employee = uniqueEmployee();
    await page.goto("/employees/new");
    await fillRequiredEmployeeFields(page, employee);
    await page.getByTestId("employee-form-submit").click();
    await expect(page).toHaveURL(/\/employees\/(\d+)\?created=1/);

    await page.goto("/employees");
    const row = page.getByTestId("employee-table").locator("tr", {
      hasText: employee.email,
    });
    await row.getByRole("button", { name: "Deactivate" }).click();

    await expect(
      page.getByTestId("employee-table").getByText(employee.email)
    ).toHaveCount(0);

    await page.getByRole("button", { name: "Inactive", exact: true }).click();
    const inactiveRow = page.getByTestId("employee-table").locator("tr", {
      hasText: employee.email,
    });
    await expect(inactiveRow).toBeVisible();
    await inactiveRow.getByRole("button", { name: "Reactivate" }).click();

    await expect(
      page.getByTestId("employee-table").getByText(employee.email)
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Active", exact: true }).click();
    await expect(
      page.getByTestId("employee-table").getByText(employee.email)
    ).toBeVisible();
  });
});

test.describe("Admin access toggle", () => {
  test("an admin cannot remove their own admin access", async ({ page }) => {
    await page.goto("/employees");
    const ownRow = page.getByTestId("employee-table").locator("tr", {
      hasText: ADMIN_USER.email,
    });
    await ownRow.locator("[data-testid^='employee-edit-link-']").click();
    await expect(page).toHaveURL(/\/employees\/\d+$/);

    await expect(page.getByTestId("role-toggle-button")).toBeDisabled();
    await expect(
      page.getByText("You can't change your own admin access.")
    ).toBeVisible();
  });

  test("an admin can revoke and restore another admin's access", async ({
    page,
  }) => {
    // The "last admin can't be demoted" guard (lib/actions/employees.ts) is
    // checked against the *acting* admin's own account first — it can't be
    // exercised through the UI without first hitting the self-demotion
    // guard above, so it's covered as a manual/exploratory case instead
    // (see the test-case sheet). This test covers the normal round trip:
    // demoting a peer admin and re-promoting them, restoring the seeded
    // fixture to how this test found it.
    await page.goto("/employees");
    const otherAdminRow = page.getByTestId("employee-table").locator("tr", {
      hasText: SECONDARY_ADMIN_USER.email,
    });
    await otherAdminRow
      .locator("[data-testid^='employee-edit-link-']")
      .click();
    await expect(page).toHaveURL(/\/employees\/\d+$/);

    await expect(page.getByTestId("employee-current-role")).toHaveText(
      "Administrator"
    );
    await page.getByTestId("role-toggle-button").click();
    await expect(page.getByTestId("employee-current-role")).toHaveText(
      "Employee"
    );

    // Restore admin access so the seeded fixture is left as it was found.
    await page.getByTestId("role-toggle-button").click();
    await expect(page.getByTestId("employee-current-role")).toHaveText(
      "Administrator"
    );
  });
});
