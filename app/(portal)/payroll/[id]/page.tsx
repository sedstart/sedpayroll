import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { employees, payrollRuns, payslips } from "@/db/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, monthLabel } from "@/lib/format";
import { markPayrollPaidAction } from "@/lib/actions/payroll";

export default async function PayrollRunPage({
  params,
}: PageProps<"/payroll/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const payrollRunId = Number(id);
  if (!Number.isInteger(payrollRunId)) notFound();

  const [run] = await db
    .select()
    .from(payrollRuns)
    .where(eq(payrollRuns.id, payrollRunId))
    .limit(1);
  if (!run) notFound();

  const rows = await db
    .select({
      id: payslips.id,
      employeeName: employees.firstName,
      lastName: employees.lastName,
      employeeCode: employees.employeeCode,
      daysPresent: payslips.daysPresent,
      daysInMonth: payslips.daysInMonth,
      grossEarnings: payslips.grossEarnings,
      totalDeductions: payslips.totalDeductions,
      netPay: payslips.netPay,
    })
    .from(payslips)
    .innerJoin(employees, eq(payslips.employeeId, employees.id))
    .where(eq(payslips.payrollRunId, payrollRunId));

  const totalNetPay = rows.reduce((sum, r) => sum + parseFloat(r.netPay), 0);
  const markAsPaid = markPayrollPaidAction.bind(null, payrollRunId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {monthLabel(run.month, run.year)}
          </h1>
          <p className="text-muted-foreground">
            {rows.length} payslip{rows.length === 1 ? "" : "s"} · Total net
            pay {formatCurrency(totalNetPay)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="capitalize" data-testid="payroll-run-status">
            {run.status}
          </Badge>
          {run.status === "processed" ? (
            <form action={markAsPaid}>
              <Button type="submit" size="sm" data-testid="mark-payroll-paid-button">
                Mark as paid
              </Button>
            </form>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          <Table data-testid="payslips-table">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Employee</TableHead>
                <TableHead scope="col">Days present</TableHead>
                <TableHead scope="col">Gross earnings</TableHead>
                <TableHead scope="col">Deductions</TableHead>
                <TableHead scope="col" className="text-right">
                  Net pay
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} data-testid={`payslip-row-${row.id}`}>
                  <TableCell>
                    <p className="font-medium">
                      {row.employeeName} {row.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.employeeCode}
                    </p>
                  </TableCell>
                  <TableCell>
                    {row.daysPresent} / {row.daysInMonth}
                  </TableCell>
                  <TableCell>{formatCurrency(row.grossEarnings)}</TableCell>
                  <TableCell>{formatCurrency(row.totalDeductions)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(row.netPay)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
