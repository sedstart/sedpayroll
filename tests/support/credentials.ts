/**
 * Demo logins created by `bun run db:seed` (see db/seed.ts and README.md).
 * The suite authenticates against these seeded accounts instead of creating
 * throwaway users for every test — seeding is destructive (wipes all
 * tables), so it only needs to run once before the suite, not per test.
 */
export const ADMIN_USER = {
  email: "neha.iyer@sedpayroll.com",
  password: "Admin@123",
  firstName: "Neha",
  lastName: "Iyer",
} as const;

/** A second seeded admin — used by the "last admin can't be demoted" style
 * tests so demoting/promoting doesn't leave the suite without an admin. */
export const SECONDARY_ADMIN_USER = {
  email: "sanya.kapoor@sedpayroll.com",
  password: "Admin@123",
  firstName: "Sanya",
  lastName: "Kapoor",
} as const;

export const EMPLOYEE_USER = {
  email: "aditi.sharma@sedpayroll.com",
  password: "Employee@123",
  firstName: "Aditi",
  lastName: "Sharma",
} as const;

/** A second seeded employee — kept free of admin-toggle tests so it stays a
 * predictable plain "employee" fixture for other specs. */
export const SECONDARY_EMPLOYEE_USER = {
  email: "rohan.verma@sedpayroll.com",
  password: "Employee@123",
  firstName: "Rohan",
  lastName: "Verma",
} as const;

export const INVALID_USER = {
  email: "nobody@sedpayroll.com",
  password: "wrong-password",
} as const;
