import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { attendance, employees, payslips, salaryStructures } from "@/db/schema";

export type PayslipBreakdown = {
  earnings: {
    basic: number;
    hra: number;
    conveyance: number;
    medicalAllowance: number;
    specialAllowance: number;
  };
  deductions: {
    providentFund: number;
    professionalTax: number;
    lossOfPay: number;
  };
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function toNumber(value: string | number) {
  return typeof value === "number" ? value : parseFloat(value);
}

/**
 * Computes one employee's payslip figures for a given month, pro-rating
 * earnings for days absent (simple loss-of-pay), from the salary structure
 * effective on/before the 1st of that month and the attendance rows in range.
 */
export async function computePayslipForEmployee(
  employeeId: number,
  month: number,
  year: number
) {
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const totalDays = daysInMonth(year, month);
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${String(
    totalDays
  ).padStart(2, "0")}`;

  const [structure] = await db
    .select()
    .from(salaryStructures)
    .where(
      and(
        eq(salaryStructures.employeeId, employeeId),
        lte(salaryStructures.effectiveFrom, monthEnd)
      )
    )
    .orderBy(desc(salaryStructures.effectiveFrom))
    .limit(1);

  if (!structure) return null;

  const attendanceRows = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.employeeId, employeeId),
        gte(attendance.date, monthStart),
        lte(attendance.date, monthEnd)
      )
    );

  const presentDays = attendanceRows.reduce((sum, row) => {
    if (row.status === "present") return sum + 1;
    if (row.status === "half_day") return sum + 0.5;
    if (row.status === "on_leave") return sum + 1; // paid leave
    return sum;
  }, 0);

  const basic = toNumber(structure.basic);
  const hra = toNumber(structure.hra);
  const conveyance = toNumber(structure.conveyance);
  const medicalAllowance = toNumber(structure.medicalAllowance);
  const specialAllowance = toNumber(structure.specialAllowance);
  const providentFund = toNumber(structure.providentFund);
  const professionalTax = toNumber(structure.professionalTax);

  const grossFull =
    basic + hra + conveyance + medicalAllowance + specialAllowance;
  const proratedFactor = Math.min(presentDays / totalDays, 1);
  const grossEarnings = grossFull * proratedFactor;
  const lossOfPay = grossFull - grossEarnings;
  const totalDeductions = providentFund + professionalTax + lossOfPay;
  const netPay = grossEarnings - providentFund - professionalTax;

  const breakdown: PayslipBreakdown = {
    earnings: {
      basic: basic * proratedFactor,
      hra: hra * proratedFactor,
      conveyance: conveyance * proratedFactor,
      medicalAllowance: medicalAllowance * proratedFactor,
      specialAllowance: specialAllowance * proratedFactor,
    },
    deductions: {
      providentFund,
      professionalTax,
      lossOfPay,
    },
  };

  return {
    daysPresent: presentDays,
    daysInMonth: totalDays,
    grossEarnings,
    totalDeductions,
    netPay,
    breakdown,
  };
}

export async function runPayrollForMonth(
  month: number,
  year: number,
  payrollRunId: number
) {
  const activeEmployees = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.status, "active"));

  const results: { employeeId: number; skipped: boolean }[] = [];

  for (const employee of activeEmployees) {
    const computed = await computePayslipForEmployee(
      employee.id,
      month,
      year
    );
    if (!computed) {
      results.push({ employeeId: employee.id, skipped: true });
      continue;
    }

    await db.insert(payslips).values({
      payrollRunId,
      employeeId: employee.id,
      daysPresent: computed.daysPresent.toString(),
      daysInMonth: computed.daysInMonth,
      grossEarnings: computed.grossEarnings.toFixed(2),
      totalDeductions: computed.totalDeductions.toFixed(2),
      netPay: computed.netPay.toFixed(2),
      breakdown: computed.breakdown,
    });
    results.push({ employeeId: employee.id, skipped: false });
  }

  return results;
}
