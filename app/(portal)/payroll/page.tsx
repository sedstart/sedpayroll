import Link from "next/link";
import { desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { payrollRuns } from "@/db/schema";
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
import { RunPayrollForm } from "@/components/payroll/run-payroll-form";
import { formatDate, monthLabel } from "@/lib/format";

export default async function PayrollPage() {
  await requireAdmin();

  const runs = await db
    .select()
    .from(payrollRuns)
    .orderBy(desc(payrollRuns.year), desc(payrollRuns.month));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
        <p className="text-muted-foreground">
          Run monthly payroll and review past payslips.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run payroll</CardTitle>
        </CardHeader>
        <CardContent>
          <RunPayrollForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payroll runs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table data-testid="payroll-runs-table">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Month</TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col">Processed on</TableHead>
                <TableHead scope="col" className="text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No payroll runs yet.
                  </TableCell>
                </TableRow>
              ) : (
                runs.map((run) => (
                  <TableRow key={run.id} data-testid={`payroll-run-row-${run.id}`}>
                    <TableCell className="font-medium">
                      {monthLabel(run.month, run.year)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={run.status === "draft" ? "secondary" : "default"} className="capitalize">
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {run.processedAt ? formatDate(run.processedAt) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/payroll/${run.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                        data-testid={`payroll-run-view-${run.id}`}
                      >
                        View payslips
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
