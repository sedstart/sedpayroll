"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { payrollRuns } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { runPayrollForMonth } from "@/lib/payroll";

export type PayrollActionState = { error?: string } | undefined;

export async function runPayrollAction(
  _prevState: PayrollActionState,
  formData: FormData
): Promise<PayrollActionState> {
  const session = await requireAdmin();

  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));

  if (!month || month < 1 || month > 12 || !year) {
    return { error: "Pick a valid month and year." };
  }

  const [existing] = await db
    .select()
    .from(payrollRuns)
    .where(and(eq(payrollRuns.month, month), eq(payrollRuns.year, year)))
    .limit(1);

  if (existing) {
    return { error: "Payroll for this month has already been run." };
  }

  const [run] = await db
    .insert(payrollRuns)
    .values({
      month,
      year,
      status: "processed",
      processedAt: new Date(),
      processedBy: Number(session.user.id),
    })
    .returning();

  await runPayrollForMonth(month, year, run.id);

  revalidatePath("/payroll");
  redirect(`/payroll/${run.id}`);
}

export async function markPayrollPaidAction(payrollRunId: number) {
  await requireAdmin();

  await db
    .update(payrollRuns)
    .set({ status: "paid" })
    .where(eq(payrollRuns.id, payrollRunId));

  revalidatePath("/payroll");
  revalidatePath(`/payroll/${payrollRunId}`);
}
