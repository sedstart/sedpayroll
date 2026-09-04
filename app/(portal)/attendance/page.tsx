import { desc, eq } from "drizzle-orm";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { attendance } from "@/db/schema";
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
import { formatDate, formatTime } from "@/lib/format";

export default async function MyAttendancePage() {
  const session = await requireSession();

  const rows = await db
    .select()
    .from(attendance)
    .where(eq(attendance.employeeId, session.user.employeeId))
    .orderBy(desc(attendance.date))
    .limit(60);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          My attendance
        </h1>
        <p className="text-muted-foreground">
          Your clock-in / clock-out history for the last 60 records.
        </p>
      </div>

      <Card className="from-sky-100/80 dark:from-sky-500/15">
        <CardHeader>
          <CardTitle className="text-base">History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table data-testid="my-attendance-table">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Date</TableHead>
                <TableHead scope="col">Clock in</TableHead>
                <TableHead scope="col">Clock out</TableHead>
                <TableHead scope="col">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No attendance records yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} data-testid={`attendance-row-${row.id}`}>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell>
                      {row.clockIn ? formatTime(row.clockIn) : "—"}
                    </TableCell>
                    <TableCell>
                      {row.clockOut ? formatTime(row.clockOut) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={row.status === "present" ? "success" : "secondary"}
                        className="capitalize"
                      >
                        {row.status.replace("_", " ")}
                      </Badge>
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
