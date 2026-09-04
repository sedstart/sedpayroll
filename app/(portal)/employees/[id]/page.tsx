import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  departments,
  designations,
  employees,
  salaryStructures,
  users,
} from "@/db/schema";
import { EmployeeForm } from "@/components/employees/employee-form";
import { RoleToggleForm } from "@/components/employees/role-toggle-form";
import { updateEmployeeAction } from "@/lib/actions/employees";
import { requireAdmin } from "@/lib/session";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KeyRound } from "lucide-react";

export default async function EditEmployeePage({
  params,
  searchParams,
}: PageProps<"/employees/[id]">) {
  const session = await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;
  const employeeId = Number(id);
  if (!Number.isInteger(employeeId)) notFound();

  const [employee] = await db
    .select()
    .from(employees)
    .where(eq(employees.id, employeeId))
    .limit(1);
  if (!employee) notFound();

  const [departmentRows, designationRows, [latestSalary], [employeeUser]] =
    await Promise.all([
      db.select().from(departments),
      db.select().from(designations),
      db
        .select()
        .from(salaryStructures)
        .where(eq(salaryStructures.employeeId, employeeId))
        .orderBy(desc(salaryStructures.effectiveFrom))
        .limit(1),
      db
        .select({ id: users.id, role: users.role })
        .from(users)
        .where(eq(users.employeeId, employeeId))
        .limit(1),
    ]);

  const boundAction = updateEmployeeAction.bind(null, employeeId);
  const isSelf = !!employeeUser && String(employeeUser.id) === session.user.id;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-muted-foreground">
            {employee.employeeCode} · {employee.email}
          </p>
        </div>
        <Badge variant={employee.status === "active" ? "default" : "secondary"}>
          {employee.status}
        </Badge>
      </div>

      {created ? (
        <Alert>
          <KeyRound className="size-4" aria-hidden="true" />
          <AlertTitle>Employee created</AlertTitle>
          <AlertDescription>
            Share these login details with {employee.firstName}: email{" "}
            <strong>{employee.email}</strong>, temporary password{" "}
            <strong>
              {employeeUser?.role === "admin" ? "Admin@123" : "Employee@123"}
            </strong>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      {employeeUser ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin access</CardTitle>
            <CardDescription>
              Admin is a role on top of this employee&apos;s own login —
              grant or remove it any time.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Badge
              variant={employeeUser.role === "admin" ? "default" : "secondary"}
              data-testid="employee-current-role"
            >
              {employeeUser.role === "admin" ? "Administrator" : "Employee"}
            </Badge>
            <RoleToggleForm
              employeeId={employeeId}
              role={employeeUser.role}
              disabled={isSelf}
            />
            {isSelf ? (
              <p className="text-xs text-muted-foreground">
                You can&apos;t change your own admin access.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <EmployeeForm
        action={boundAction}
        departments={departmentRows.map((d) => ({ id: d.id, label: d.name }))}
        designations={designationRows.map((d) => ({
          id: d.id,
          label: d.title,
        }))}
        defaultValues={{
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone,
          departmentId: employee.departmentId,
          designationId: employee.designationId,
          gender: employee.gender,
          dateOfBirth: employee.dateOfBirth,
          dateOfJoining: employee.dateOfJoining,
          address: employee.address,
          bankAccountNumber: employee.bankAccountNumber,
          bankName: employee.bankName,
          ifsc: employee.ifsc,
          panNumber: employee.panNumber,
          basic: latestSalary?.basic,
          hra: latestSalary?.hra,
          conveyance: latestSalary?.conveyance,
          medicalAllowance: latestSalary?.medicalAllowance,
          specialAllowance: latestSalary?.specialAllowance,
          providentFund: latestSalary?.providentFund,
          professionalTax: latestSalary?.professionalTax,
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
