import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { employees, payrollRuns, payslips } from "@/db/schema";
import type { PayslipBreakdown } from "@/lib/payroll";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, monthLabel } from "@/lib/format";

export default async function PayslipDetailPage({
  params,
}: PageProps<"/payslips/[id]">) {
  const session = await requireSession();
  const { id } = await params;
  const payslipId = Number(id);
  if (!Number.isInteger(payslipId)) notFound();

  const [row] = await db
    .select({
      id: payslips.id,
      daysPresent: payslips.daysPresent,
      daysInMonth: payslips.daysInMonth,
      grossEarnings: payslips.grossEarnings,
      totalDeductions: payslips.totalDeductions,
      netPay: payslips.netPay,
      breakdown: payslips.breakdown,
      employeeId: payslips.employeeId,
      month: payrollRuns.month,
      year: payrollRuns.year,
      employeeName: employees.firstName,
      lastName: employees.lastName,
      employeeCode: employees.employeeCode,
    })
    .from(payslips)
    .innerJoin(payrollRuns, eq(payslips.payrollRunId, payrollRuns.id))
    .innerJoin(employees, eq(payslips.employeeId, employees.id))
    .where(eq(payslips.id, payslipId))
    .limit(1);

  // Admins manage payroll but a payslip is still personal data — only the
  // owning employee (admin or not) may view their own payslip here.
  if (!row || row.employeeId !== session.user.employeeId) notFound();

  const breakdown = row.breakdown as PayslipBreakdown;

  const earningsRows = [
    ["Basic", breakdown.earnings.basic],
    ["HRA", breakdown.earnings.hra],
    ["Conveyance", breakdown.earnings.conveyance],
    ["Medical allowance", breakdown.earnings.medicalAllowance],
    ["Special allowance", breakdown.earnings.specialAllowance],
  ] as const;

  const deductionRows = [
    ["Provident fund", breakdown.deductions.providentFund],
    ["Professional tax", breakdown.deductions.professionalTax],
    ["Loss of pay", breakdown.deductions.lossOfPay],
  ] as const;

  return (
    <div className="mx-auto max-w-2xl space-y-6" data-testid="payslip-detail">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Payslip · {monthLabel(row.month, row.year)}
        </h1>
        <p className="text-muted-foreground">
          {row.employeeName} {row.lastName} · {row.employeeCode} ·{" "}
          {row.daysPresent}/{row.daysInMonth} days present
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            {earningsRows.map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{formatCurrency(value)}</dd>
              </div>
            ))}
          </dl>
          <Separator className="my-3" />
          <div className="flex justify-between text-sm font-semibold">
            <span>Gross earnings</span>
            <span>{formatCurrency(row.grossEarnings)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deductions</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            {deductionRows.map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd>{formatCurrency(value)}</dd>
              </div>
            ))}
          </dl>
          <Separator className="my-3" />
          <div className="flex justify-between text-sm font-semibold">
            <span>Total deductions</span>
            <span>{formatCurrency(row.totalDeductions)}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between py-6">
          <span className="text-lg font-semibold">Net pay</span>
          <span
            className="text-2xl font-bold"
            data-testid="payslip-net-pay"
          >
            {formatCurrency(row.netPay)}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
