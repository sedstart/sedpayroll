import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { Users, CalendarCheck, Banknote, UserX } from "lucide-react";
import { db } from "@/db";
import { attendance, employees, payrollRuns, payslips } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { ClockWidget } from "@/components/attendance/clock-widget";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, monthLabel, todayISODate } from "@/lib/format";

export default async function DashboardPage() {
  const session = await requireSession();
  const employeeId = session.user.employeeId;
  const isAdmin = session.user.role === "admin";
  const today = todayISODate();

  const [[todayRecord], [latestPayslip]] = await Promise.all([
    db
      .select()
      .from(attendance)
      .where(
        and(eq(attendance.employeeId, employeeId), eq(attendance.date, today))
      )
      .limit(1),
    db
      .select()
      .from(payslips)
      .where(eq(payslips.employeeId, employeeId))
      .orderBy(desc(payslips.generatedAt))
      .limit(1),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back
        </h1>
        <p className="text-muted-foreground">
          Clock in to start tracking today&apos;s attendance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ClockWidget
          clockIn={todayRecord?.clockIn ?? null}
          clockOut={todayRecord?.clockOut ?? null}
        />

        <Card
          data-testid="latest-payslip-card"
          className="bg-linear-to-br from-emerald-50 to-card dark:from-emerald-500/10 dark:to-card border-emerald-100 dark:border-emerald-500/20"
        >
          <CardHeader>
            <CardTitle className="text-base">Latest payslip</CardTitle>
            <CardDescription>
              {latestPayslip
                ? "Most recently generated payslip"
                : "No payslips yet"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {latestPayslip ? (
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {formatCurrency(latestPayslip.netPay)}
                </p>
                <p className="text-sm text-muted-foreground">Net pay</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Your first payslip will appear here once payroll is run.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {isAdmin ? <OrganizationOverview /> : null}
    </div>
  );
}

async function OrganizationOverview() {
  const [[{ count: activeCount }], [{ count: inactiveCount }]] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(employees)
        .where(eq(employees.status, "active")),
      db
        .select({ count: sql<number>`count(*)` })
        .from(employees)
        .where(eq(employees.status, "inactive")),
    ]);

  const today = todayISODate();
  const [{ count: presentToday }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(attendance)
    .where(
      and(
        eq(attendance.date, today),
        sql`${attendance.status} in ('present','half_day')`
      )
    );

  const recentRuns = await db
    .select()
    .from(payrollRuns)
    .orderBy(desc(payrollRuns.year), desc(payrollRuns.month))
    .limit(5);

  const stats = [
    {
      label: "Active employees",
      value: activeCount,
      icon: Users,
      href: "/employees",
      accent:
        "from-indigo-50 dark:from-indigo-500/10 border-indigo-100 dark:border-indigo-500/20",
      iconAccent: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400",
    },
    {
      label: "Present today",
      value: presentToday,
      icon: CalendarCheck,
      href: "/team-attendance",
      accent:
        "from-emerald-50 dark:from-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
      iconAccent: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
    },
    {
      label: "Payroll runs",
      value: recentRuns.length,
      icon: Banknote,
      href: "/payroll",
      accent:
        "from-amber-50 dark:from-amber-500/10 border-amber-100 dark:border-amber-500/20",
      iconAccent: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
    },
    {
      label: "Inactive employees",
      value: inactiveCount,
      icon: UserX,
      href: "/employees?status=inactive",
      accent:
        "from-violet-50 dark:from-violet-500/10 border-violet-100 dark:border-violet-500/20",
      iconAccent: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
    },
  ];

  return (
    <section className="space-y-4" data-testid="organization-overview" aria-label="Organization overview">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Organization overview
        </h2>
        <p className="text-sm text-muted-foreground">
          Visible to administrators only.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card
              className={`bg-linear-to-br to-card transition-colors hover:brightness-95 dark:hover:brightness-110 ${stat.accent}`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <span
                  className={`flex size-7 items-center justify-center rounded-full ${stat.iconAccent}`}
                >
                  <stat.icon className="size-4" aria-hidden="true" />
                </span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent payroll runs</CardTitle>
            <CardDescription>Latest processed payroll cycles.</CardDescription>
          </div>
          <Button
            size="sm"
            nativeButton={false}
            render={<Link href="/payroll">Go to payroll</Link>}
          />
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payroll runs yet.
            </p>
          ) : (
            <ul className="divide-y">
              {recentRuns.map((run) => (
                <li
                  key={run.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <Link
                    href={`/payroll/${run.id}`}
                    className="font-medium hover:underline"
                  >
                    {monthLabel(run.month, run.year)}
                  </Link>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span className="capitalize">{run.status}</span>
                    {run.processedAt ? (
                      <span>{formatDate(run.processedAt)}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
