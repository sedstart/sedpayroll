"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { attendance } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { todayISODate } from "@/lib/format";

export type AttendanceActionState = { error?: string } | undefined;

export async function clockInAction(): Promise<AttendanceActionState> {
  const session = await requireSession();
  const employeeId = session.user.employeeId;
  const today = todayISODate();

  const [existing] = await db
    .select()
    .from(attendance)
    .where(
      and(eq(attendance.employeeId, employeeId), eq(attendance.date, today))
    )
    .limit(1);

  if (existing) {
    return { error: "You have already clocked in today." };
  }

  await db.insert(attendance).values({
    employeeId,
    date: today,
    clockIn: new Date(),
    status: "present",
  });

  revalidatePath("/");
  revalidatePath("/attendance");
}

export async function clockOutAction(): Promise<AttendanceActionState> {
  const session = await requireSession();
  const employeeId = session.user.employeeId;
  const today = todayISODate();

  const [existing] = await db
    .select()
    .from(attendance)
    .where(
      and(eq(attendance.employeeId, employeeId), eq(attendance.date, today))
    )
    .limit(1);

  if (!existing || !existing.clockIn) {
    return { error: "You need to clock in first." };
  }
  if (existing.clockOut) {
    return { error: "You have already clocked out today." };
  }

  const clockOut = new Date();
  const hoursWorked =
    (clockOut.getTime() - new Date(existing.clockIn).getTime()) /
    (1000 * 60 * 60);

  await db
    .update(attendance)
    .set({
      clockOut,
      status: hoursWorked < 5 ? "half_day" : "present",
    })
    .where(eq(attendance.id, existing.id));

  revalidatePath("/");
  revalidatePath("/attendance");
}
