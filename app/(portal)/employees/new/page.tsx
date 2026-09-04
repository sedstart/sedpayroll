import { requireAdmin } from "@/lib/session";
import { db } from "@/db";
import { departments, designations } from "@/db/schema";
import { EmployeeForm } from "@/components/employees/employee-form";
import { createEmployeeAction } from "@/lib/actions/employees";

export default async function NewEmployeePage() {
  await requireAdmin();

  const [departmentRows, designationRows] = await Promise.all([
    db.select().from(departments),
    db.select().from(designations),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Add employee
        </h1>
        <p className="text-muted-foreground">
          A login will be created automatically for this employee.
        </p>
      </div>

      <EmployeeForm
        action={createEmployeeAction}
        departments={departmentRows.map((d) => ({ id: d.id, label: d.name }))}
        designations={designationRows.map((d) => ({
          id: d.id,
          label: d.title,
        }))}
        submitLabel="Create employee"
        showAdminOption
      />
    </div>
  );
}
