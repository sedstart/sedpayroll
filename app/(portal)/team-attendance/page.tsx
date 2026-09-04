import { and, eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { attendance, employees } from "@/db/schema";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { formatTime, todayISODate } from "@/lib/format";

export default async function TeamAttendancePage({
  searchParams,
}: PageProps<"/team-attendance">) {
  await requireAdmin();
  const { date: dateParam } = await searchParams;
  const date =
    typeof dateParam === "string" && dateParam ? dateParam : todayISODate();

  const rows = await db
    .select({
      id: employees.id,
      firstName: employees.firstName,
      lastName: employees.lastName,
      employeeCode: employees.employeeCode,
      clockIn: attendance.clockIn,
      clockOut: attendance.clockOut,
      status: attendance.status,
    })
    .from(employees)
    .leftJoin(
      attendance,
      and(eq(attendance.employeeId, employees.id), eq(attendance.date, date))
    )
    .where(eq(employees.status, "active"))
    .orderBy(employees.firstName);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Team attendance
          </h1>
          <p className="text-muted-foreground">
            Daily clock-in / clock-out log for all active employees.
          </p>
        </div>
        <form className="flex items-center gap-2" data-testid="attendance-date-form">
          <label htmlFor="attendance-date" className="sr-only">
            Select date
          </label>
          <DatePicker
            id="attendance-date"
            name="date"
            defaultValue={date}
            className="w-auto"
            data-testid="attendance-date-input"
          />
          <Button type="submit" variant="outline" size="sm">
            View
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{date}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table data-testid="team-attendance-table">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Employee</TableHead>
                <TableHead scope="col">Clock in</TableHead>
                <TableHead scope="col">Clock out</TableHead>
                <TableHead scope="col">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} data-testid={`team-attendance-row-${row.id}`}>
                  <TableCell>
                    <p className="font-medium">
                      {row.firstName} {row.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.employeeCode}
                    </p>
                  </TableCell>
                  <TableCell>
                    {row.clockIn ? formatTime(row.clockIn) : "—"}
                  </TableCell>
                  <TableCell>
                    {row.clockOut ? formatTime(row.clockOut) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        !row.status
                          ? "secondary"
                          : row.status === "present"
                            ? "default"
                            : "secondary"
                      }
                      className="capitalize"
                    >
                      {row.status?.replace("_", " ") ?? "Not marked"}
                    </Badge>
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
