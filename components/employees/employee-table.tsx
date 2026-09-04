import Link from "next/link";
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
import { formatDate } from "@/lib/format";
import { setEmployeeStatusAction } from "@/lib/actions/employees";
import { RoleToggleForm } from "@/components/employees/role-toggle-form";

type EmployeeRow = {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "active" | "inactive";
  dateOfJoining: string;
  department: string | null;
  designation: string | null;
  userId: number | null;
  role: "admin" | "employee" | null;
};

export function EmployeeTable({
  employees,
  currentUserId,
}: {
  employees: EmployeeRow[];
  currentUserId: string;
}) {
  if (employees.length === 0) {
    return (
      <p
        data-testid="employee-table-empty"
        className="py-8 text-center text-sm text-muted-foreground"
      >
        No employees found.
      </p>
    );
  }

  return (
    <Table data-testid="employee-table">
      <TableHeader>
        <TableRow>
          <TableHead scope="col">Employee</TableHead>
          <TableHead scope="col">Department</TableHead>
          <TableHead scope="col">Designation</TableHead>
          <TableHead scope="col">Joined</TableHead>
          <TableHead scope="col">Status</TableHead>
          <TableHead scope="col">Role</TableHead>
          <TableHead scope="col" className="text-right">
            Actions
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => {
          const fullName = `${employee.firstName} ${employee.lastName}`;
          const nextStatus =
            employee.status === "active" ? "inactive" : "active";
          const toggleStatus = setEmployeeStatusAction.bind(
            null,
            employee.id,
            nextStatus
          );
          const isSelf =
            !!employee.userId && String(employee.userId) === currentUserId;
          return (
            <TableRow
              key={employee.id}
              data-testid={`employee-row-${employee.id}`}
            >
              <TableCell>
                <Link
                  href={`/employees/${employee.id}`}
                  className="font-medium hover:underline"
                  data-testid={`employee-name-link-${employee.id}`}
                >
                  {fullName}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {employee.employeeCode} · {employee.email}
                </p>
              </TableCell>
              <TableCell>{employee.department ?? "—"}</TableCell>
              <TableCell>{employee.designation ?? "—"}</TableCell>
              <TableCell>{formatDate(employee.dateOfJoining)}</TableCell>
              <TableCell>
                <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                  {employee.status}
                </Badge>
              </TableCell>
              <TableCell>
                {employee.role ? (
                  <div className="flex flex-col items-start gap-1.5">
                    <Badge
                      variant={employee.role === "admin" ? "default" : "secondary"}
                      data-testid={`employee-role-${employee.id}`}
                    >
                      {employee.role === "admin" ? "Administrator" : "Employee"}
                    </Badge>
                    <RoleToggleForm
                      employeeId={employee.id}
                      role={employee.role}
                      disabled={isSelf}
                    />
                  </div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={
                      <Link
                        href={`/employees/${employee.id}`}
                        aria-label={`Edit ${fullName}`}
                        data-testid={`employee-edit-link-${employee.id}`}
                      >
                        Edit
                      </Link>
                    }
                  />
                  <form action={toggleStatus}>
                    <Button
                      type="submit"
                      variant={
                        employee.status === "active"
                          ? "destructive"
                          : "outline"
                      }
                      size="sm"
                      aria-label={
                        employee.status === "active"
                          ? `Deactivate ${fullName}`
                          : `Reactivate ${fullName}`
                      }
                      data-testid={`employee-toggle-status-${employee.id}`}
                    >
                      {employee.status === "active"
                        ? "Deactivate"
                        : "Reactivate"}
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
