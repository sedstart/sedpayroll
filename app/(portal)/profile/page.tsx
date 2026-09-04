import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { departments, designations, employees } from "@/db/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export default async function ProfilePage() {
  const session = await requireSession();

  const [employee] = await db
    .select({
      firstName: employees.firstName,
      lastName: employees.lastName,
      employeeCode: employees.employeeCode,
      email: employees.email,
      phone: employees.phone,
      dateOfJoining: employees.dateOfJoining,
      dateOfBirth: employees.dateOfBirth,
      address: employees.address,
      department: departments.name,
      designation: designations.title,
    })
    .from(employees)
    .leftJoin(departments, eq(employees.departmentId, departments.id))
    .leftJoin(designations, eq(employees.designationId, designations.id))
    .where(eq(employees.id, session.user.employeeId))
    .limit(1);

  if (!employee) return null;

  const fields: [string, string][] = [
    ["Employee code", employee.employeeCode],
    ["Full name", `${employee.firstName} ${employee.lastName}`],
    ["Email", employee.email],
    ["Phone", employee.phone ?? "—"],
    ["Department", employee.department ?? "—"],
    ["Designation", employee.designation ?? "—"],
    ["Date of joining", formatDate(employee.dateOfJoining)],
    [
      "Date of birth",
      employee.dateOfBirth ? formatDate(employee.dateOfBirth) : "—",
    ],
    ["Address", employee.address ?? "—"],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My profile</h1>
        <p className="text-muted-foreground">
          Contact HR to update your profile details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl
            data-testid="employee-profile-details"
            className="grid gap-4 sm:grid-cols-2"
          >
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
