import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { departments, designations, employees, users } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmployeeTable } from "@/components/employees/employee-table";

export default async function EmployeesPage({
  searchParams,
}: PageProps<"/employees">) {
  const session = await requireAdmin();
  const { status } = await searchParams;
  const filterStatus = status === "inactive" ? "inactive" : "active";

  const rows = await db
    .select({
      id: employees.id,
      employeeCode: employees.employeeCode,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
      status: employees.status,
      dateOfJoining: employees.dateOfJoining,
      department: departments.name,
      designation: designations.title,
      userId: users.id,
      role: users.role,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(designations, eq(employees.designationId, designations.id))
    .leftJoin(users, eq(users.employeeId, employees.id))
    .where(eq(employees.status, filterStatus))
    .orderBy(desc(employees.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">
            Manage your organization&apos;s employees.
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link href="/employees/new">
              <Plus className="size-4" aria-hidden="true" />
              Add employee
            </Link>
          }
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant={filterStatus === "active" ? "default" : "outline"}
          size="sm"
          nativeButton={false}
          render={<Link href="/employees?status=active">Active</Link>}
        />
        <Button
          variant={filterStatus === "inactive" ? "default" : "outline"}
          size="sm"
          nativeButton={false}
          render={<Link href="/employees?status=inactive">Inactive</Link>}
        />
      </div>

      <Card>
        <CardContent>
          <EmployeeTable employees={rows} currentUserId={session.user.id ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}
