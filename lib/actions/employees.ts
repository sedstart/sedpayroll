"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { employees, salaryStructures, users } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { parseEmployeeFormData } from "@/lib/validation";

export type EmployeeActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  tempPassword?: string;
} | undefined;

const DEFAULT_EMPLOYEE_PASSWORD = "Employee@123";
const DEFAULT_ADMIN_PASSWORD = "Admin@123";

async function nextEmployeeCode() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees);
  return `EMP${String(Number(count) + 1).padStart(3, "0")}`;
}

export async function createEmployeeAction(
  _prevState: EmployeeActionState,
  formData: FormData
): Promise<EmployeeActionState> {
  await requireAdmin();

  const parsed = parseEmployeeFormData(formData);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);
  if (existing) {
    return {
      error: "An account with this email already exists.",
      fieldErrors: { email: ["Email already in use"] },
    };
  }

  const grantAdmin = formData.get("isAdmin") === "on";
  const employeeCode = await nextEmployeeCode();
  const passwordHash = await bcrypt.hash(
    grantAdmin ? DEFAULT_ADMIN_PASSWORD : DEFAULT_EMPLOYEE_PASSWORD,
    10
  );

  const employeeId = await db.transaction(async (tx) => {
    const [employee] = await tx
      .insert(employees)
      .values({
        employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        departmentId: data.departmentId ?? null,
        designationId: data.designationId ?? null,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth || null,
        dateOfJoining: data.dateOfJoining,
        address: data.address || null,
        bankAccountNumber: data.bankAccountNumber || null,
        bankName: data.bankName || null,
        ifsc: data.ifsc || null,
        panNumber: data.panNumber || null,
      })
      .returning({ id: employees.id });

    await tx.insert(users).values({
      email: data.email,
      passwordHash,
      role: grantAdmin ? "admin" : "employee",
      employeeId: employee.id,
    });

    await tx.insert(salaryStructures).values({
      employeeId: employee.id,
      effectiveFrom: data.dateOfJoining,
      basic: data.basic.toString(),
      hra: data.hra.toString(),
      conveyance: data.conveyance.toString(),
      medicalAllowance: data.medicalAllowance.toString(),
      specialAllowance: data.specialAllowance.toString(),
      providentFund: data.providentFund.toString(),
      professionalTax: data.professionalTax.toString(),
      ctc: (
        (data.basic +
          data.hra +
          data.conveyance +
          data.medicalAllowance +
          data.specialAllowance) *
        12
      ).toString(),
    });

    return employee.id;
  });

  revalidatePath("/employees");
  redirect(`/employees/${employeeId}?created=1`);
}

export async function updateEmployeeAction(
  employeeId: number,
  _prevState: EmployeeActionState,
  formData: FormData
): Promise<EmployeeActionState> {
  await requireAdmin();

  const parsed = parseEmployeeFormData(formData);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const data = parsed.data;

  const [emailOwner] = await db
    .select({ employeeId: users.employeeId })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);
  if (emailOwner && emailOwner.employeeId !== employeeId) {
    return {
      error: "An account with this email already exists.",
      fieldErrors: { email: ["Email already in use"] },
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(employees)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        departmentId: data.departmentId ?? null,
        designationId: data.designationId ?? null,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth || null,
        dateOfJoining: data.dateOfJoining,
        address: data.address || null,
        bankAccountNumber: data.bankAccountNumber || null,
        bankName: data.bankName || null,
        ifsc: data.ifsc || null,
        panNumber: data.panNumber || null,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, employeeId));

    await tx
      .update(users)
      .set({ email: data.email })
      .where(eq(users.employeeId, employeeId));

    await tx.insert(salaryStructures).values({
      employeeId,
      effectiveFrom: new Date().toISOString().slice(0, 10),
      basic: data.basic.toString(),
      hra: data.hra.toString(),
      conveyance: data.conveyance.toString(),
      medicalAllowance: data.medicalAllowance.toString(),
      specialAllowance: data.specialAllowance.toString(),
      providentFund: data.providentFund.toString(),
      professionalTax: data.professionalTax.toString(),
      ctc: (
        (data.basic +
          data.hra +
          data.conveyance +
          data.medicalAllowance +
          data.specialAllowance) *
        12
      ).toString(),
    });
  });

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
  return { success: true };
}

export async function setEmployeeStatusAction(
  employeeId: number,
  status: "active" | "inactive"
) {
  await requireAdmin();

  await db
    .update(employees)
    .set({
      status,
      dateOfLeaving:
        status === "inactive" ? new Date().toISOString().slice(0, 10) : null,
      updatedAt: new Date(),
    })
    .where(eq(employees.id, employeeId));

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
}

export type RoleActionState = { error?: string } | undefined;

/**
 * Admin is just a role flag on an employee's own login — any employee can be
 * granted or stripped of it. Guards against locking everyone out: an admin
 * cannot remove their own access, and the last remaining admin cannot be
 * demoted.
 */
export async function setEmployeeRoleAction(
  employeeId: number,
  role: "admin" | "employee"
): Promise<RoleActionState> {
  const session = await requireAdmin();

  if (role === "employee") {
    const [target] = await db
      .select({ userId: users.id })
      .from(users)
      .where(eq(users.employeeId, employeeId))
      .limit(1);

    if (target && String(target.userId) === session.user.id) {
      return { error: "You cannot remove your own admin access." };
    }

    const [{ count: adminCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "admin"));

    if (Number(adminCount) <= 1) {
      return { error: "There must be at least one admin." };
    }
  }

  await db
    .update(users)
    .set({ role })
    .where(eq(users.employeeId, employeeId));

  revalidatePath("/employees");
  revalidatePath(`/employees/${employeeId}`);
}
