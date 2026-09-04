import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { payrollRuns, payslips } from "@/db/schema";
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
import { formatCurrency, monthLabel } from "@/lib/format";

export default async function MyPayslipsPage() {
  const session = await requireSession();

  const rows = await db
    .select({
      id: payslips.id,
      month: payrollRuns.month,
      year: payrollRuns.year,
      netPay: payslips.netPay,
      grossEarnings: payslips.grossEarnings,
    })
    .from(payslips)
    .innerJoin(payrollRuns, eq(payslips.payrollRunId, payrollRuns.id))
    .where(eq(payslips.employeeId, session.user.employeeId))
    .orderBy(desc(payrollRuns.year), desc(payrollRuns.month));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          My payslips
        </h1>
        <p className="text-muted-foreground">
          View and open your monthly payslips.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          <Table data-testid="my-payslips-table">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Month</TableHead>
                <TableHead scope="col">Gross earnings</TableHead>
                <TableHead scope="col">Net pay</TableHead>
                <TableHead scope="col" className="text-right">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No payslips yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} data-testid={`my-payslip-row-${row.id}`}>
                    <TableCell className="font-medium">
                      {monthLabel(row.month, row.year)}
                    </TableCell>
                    <TableCell>{formatCurrency(row.grossEarnings)}</TableCell>
                    <TableCell>{formatCurrency(row.netPay)}</TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/payslips/${row.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                        data-testid={`my-payslip-view-${row.id}`}
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
