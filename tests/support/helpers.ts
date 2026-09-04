import { type Page, expect } from "@playwright/test";

/**
 * Fills the login form and submits it. Does not assert the outcome — callers
 * check for either a redirect to "/" or the `login-error` banner.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByTestId("login-email-input").fill(email);
  await page.getByTestId("login-password-input").fill(password);
  await page.getByTestId("login-submit-button").click();
}

/**
 * Opens a `DatePicker` (components/ui/date-picker.tsx) by its trigger `id`
 * and selects today's date from the calendar popover.
 *
 * The picker's hidden `<input>` is fully React-controlled (its value comes
 * from calendar selection only), so the only reliable way to set it is
 * through the popover UI. Each day button carries
 * `data-day="<date.toLocaleDateString()>"` with no locale passed, so we
 * compute the same string client-side to find today's cell unambiguously
 * regardless of the runner's locale/timezone.
 */
export async function pickToday(page: Page, triggerId: string) {
  await page.locator(`#${triggerId}`).click();
  const todayDataDay = await page.evaluate(() => new Date().toLocaleDateString());
  await page.locator(`button[data-day="${todayDataDay}"]`).first().click();
}

/** Builds a unique-per-run fake employee identity so create-employee tests
 * never collide with seeded data or with each other on repeated runs. */
export function uniqueEmployee() {
  const stamp = Date.now();
  return {
    firstName: "Test",
    lastName: `Employee${stamp}`,
    email: `test.employee.${stamp}@sedpayroll.com`,
  };
}

/**
 * Fills every field the create/edit employee form actually requires for a
 * successful submit: first/last name, email, gender, department,
 * designation, date of joining, and basic salary.
 *
 * Gender/department/designation are modelled as "optional" in
 * lib/validation.ts, but the Select components always submit an empty
 * string (never omit the key) when nothing is chosen — and
 * `z.enum(...).optional()` / `z.coerce.number().int().positive().optional()`
 * only skip validation when the key is genuinely absent, not when it's `""`.
 * So in practice all three are required to submit successfully, and none of
 * the three renders a field-level error when left blank (only the generic
 * "Please fix the highlighted fields." banner) — worth a bug report, but
 * tests work around it by always filling them in.
 */
export async function fillRequiredEmployeeFields(
  page: Page,
  employee: { firstName: string; lastName: string; email: string },
  basic = "35000"
) {
  await page.getByTestId("employee-firstName-input").fill(employee.firstName);
  await page.getByTestId("employee-lastName-input").fill(employee.lastName);
  await page.getByTestId("employee-email-input").fill(employee.email);
  await selectOption(page, "employee-gender-select", "Female");
  await selectOption(page, "employee-department-select", "Engineering");
  await selectOption(page, "employee-designation-select", "Software Engineer");
  await pickToday(page, "dateOfJoining");
  await page.getByTestId("employee-basic-input").fill(basic);
}

/** Asserts the portal shell rendered — i.e. we're on an authenticated page. */
export async function expectAuthenticated(page: Page) {
  await expect(page.getByTestId("sidebar")).toBeVisible();
}

/**
 * Opens a shadcn/Base UI `<Select>` by its trigger's `data-testid` and picks
 * the option with the given accessible name (Base UI implements the ARIA
 * listbox pattern, so options are real `role="option"` elements).
 */
export async function selectOption(
  page: Page,
  triggerTestId: string,
  optionName: string
) {
  await page.getByTestId(triggerTestId).click();
  // exact: true — several selects have overlapping labels (e.g. "Software
  // Engineer" / "Senior Software Engineer"), so a substring match is
  // ambiguous.
  await page.getByRole("option", { name: optionName, exact: true }).click();
}
