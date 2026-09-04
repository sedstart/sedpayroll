import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  date,
  integer,
  numeric,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["admin", "employee"]);
export const employeeStatusEnum = pgEnum("employee_status", [
  "active",
  "inactive",
]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "half_day",
  "on_leave",
]);
export const payrollStatusEnum = pgEnum("payroll_status", [
  "draft",
  "processed",
  "paid",
]);

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const designations = pgTable("designations", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 120 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeCode: varchar("employee_code", { length: 20 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  departmentId: integer("department_id").references(() => departments.id, {
    onDelete: "set null",
  }),
  designationId: integer("designation_id").references(() => designations.id, {
    onDelete: "set null",
  }),
  gender: genderEnum("gender"),
  dateOfBirth: date("date_of_birth"),
  dateOfJoining: date("date_of_joining").notNull(),
  dateOfLeaving: date("date_of_leaving"),
  status: employeeStatusEnum("status").notNull().default("active"),
  address: text("address"),
  bankAccountNumber: varchar("bank_account_number", { length: 40 }),
  bankName: varchar("bank_name", { length: 120 }),
  ifsc: varchar("ifsc", { length: 20 }),
  panNumber: varchar("pan_number", { length: 20 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  // "admin" is just a role toggle on an employee's own login — every user is
  // an employee first, admin access is granted/revoked on top of that.
  role: roleEnum("role").notNull().default("employee"),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" })
    .unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const attendance = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    clockIn: timestamp("clock_in", { withTimezone: true }),
    clockOut: timestamp("clock_out", { withTimezone: true }),
    status: attendanceStatusEnum("status").notNull().default("present"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("attendance_employee_date_idx").on(
      table.employeeId,
      table.date
    ),
  ]
);

export const salaryStructures = pgTable("salary_structures", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  effectiveFrom: date("effective_from").notNull(),
  basic: numeric("basic", { precision: 12, scale: 2 }).notNull(),
  hra: numeric("hra", { precision: 12, scale: 2 }).notNull().default("0"),
  conveyance: numeric("conveyance", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  medicalAllowance: numeric("medical_allowance", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  specialAllowance: numeric("special_allowance", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  providentFund: numeric("provident_fund", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  professionalTax: numeric("professional_tax", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  ctc: numeric("ctc", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const payrollRuns = pgTable(
  "payroll_runs",
  {
    id: serial("id").primaryKey(),
    month: integer("month").notNull(), // 1-12
    year: integer("year").notNull(),
    status: payrollStatusEnum("status").notNull().default("draft"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    processedBy: integer("processed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("payroll_runs_month_year_idx").on(table.month, table.year)]
);

export const payslips = pgTable("payslips", {
  id: serial("id").primaryKey(),
  payrollRunId: integer("payroll_run_id")
    .notNull()
    .references(() => payrollRuns.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  daysPresent: numeric("days_present", { precision: 5, scale: 1 }).notNull(),
  daysInMonth: integer("days_in_month").notNull(),
  grossEarnings: numeric("gross_earnings", { precision: 12, scale: 2 }).notNull(),
  totalDeductions: numeric("total_deductions", { precision: 12, scale: 2 }).notNull(),
  netPay: numeric("net_pay", { precision: 12, scale: 2 }).notNull(),
  breakdown: jsonb("breakdown").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Relations

export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
}));

export const designationsRelations = relations(designations, ({ many }) => ({
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  department: one(departments, {
    fields: [employees.departmentId],
    references: [departments.id],
  }),
  designation: one(designations, {
    fields: [employees.designationId],
    references: [designations.id],
  }),
  user: one(users, {
    fields: [employees.id],
    references: [users.employeeId],
  }),
  attendance: many(attendance),
  salaryStructures: many(salaryStructures),
  payslips: many(payslips),
}));

export const usersRelations = relations(users, ({ one }) => ({
  employee: one(employees, {
    fields: [users.employeeId],
    references: [employees.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  employee: one(employees, {
    fields: [attendance.employeeId],
    references: [employees.id],
  }),
}));

export const salaryStructuresRelations = relations(
  salaryStructures,
  ({ one }) => ({
    employee: one(employees, {
      fields: [salaryStructures.employeeId],
      references: [employees.id],
    }),
  })
);

export const payrollRunsRelations = relations(payrollRuns, ({ many }) => ({
  payslips: many(payslips),
}));

export const payslipsRelations = relations(payslips, ({ one }) => ({
  payrollRun: one(payrollRuns, {
    fields: [payslips.payrollRunId],
    references: [payrollRuns.id],
  }),
  employee: one(employees, {
    fields: [payslips.employeeId],
    references: [employees.id],
  }),
}));

export type Department = typeof departments.$inferSelect;
export type Designation = typeof designations.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type User = typeof users.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type SalaryStructure = typeof salaryStructures.$inferSelect;
export type PayrollRun = typeof payrollRuns.$inferSelect;
export type Payslip = typeof payslips.$inferSelect;
