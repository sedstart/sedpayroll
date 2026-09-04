"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import type { EmployeeActionState } from "@/lib/actions/employees";

type Option = { id: number; label: string };

type DefaultValues = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  departmentId: number | null;
  designationId: number | null;
  gender: "male" | "female" | "other" | null;
  dateOfBirth: string | null;
  dateOfJoining: string;
  address: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  ifsc: string | null;
  panNumber: string | null;
  basic: string;
  hra: string;
  conveyance: string;
  medicalAllowance: string;
  specialAllowance: string;
  providentFund: string;
  professionalTax: string;
}>;

export function EmployeeForm({
  action,
  departments,
  designations,
  defaultValues,
  submitLabel,
  showAdminOption,
}: {
  action: (
    prevState: EmployeeActionState,
    formData: FormData
  ) => Promise<EmployeeActionState>;
  departments: Option[];
  designations: Option[];
  defaultValues?: DefaultValues;
  submitLabel: string;
  /** Only meaningful on the "add employee" form — edit uses the dedicated
   * admin-access toggle instead (see RoleToggleForm). */
  showAdminOption?: boolean;
}) {
  const [state, formAction, isPending] = useActionState<
    EmployeeActionState,
    FormData
  >(action, undefined);

  const errors = state?.fieldErrors ?? {};
  const fieldError = (name: string) => errors[name]?.[0];

  return (
    <form
      action={formAction}
      data-testid="employee-form"
      aria-busy={isPending}
      className="space-y-6"
      noValidate
    >
      {state?.error ? (
        <div
          role="alert"
          data-testid="employee-form-error"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="firstName" label="First name" error={fieldError("firstName")}>
            <Input
              id="firstName"
              name="firstName"
              data-testid="employee-firstName-input"
              defaultValue={defaultValues?.firstName}
              aria-invalid={!!fieldError("firstName")}
              aria-describedby={fieldError("firstName") ? "firstName-error" : undefined}
              required
            />
          </Field>
          <Field id="lastName" label="Last name" error={fieldError("lastName")}>
            <Input
              id="lastName"
              name="lastName"
              data-testid="employee-lastName-input"
              defaultValue={defaultValues?.lastName}
              aria-invalid={!!fieldError("lastName")}
              aria-describedby={fieldError("lastName") ? "lastName-error" : undefined}
              required
            />
          </Field>
          <Field id="email" label="Email" error={fieldError("email")}>
            <Input
              id="email"
              type="email"
              name="email"
              data-testid="employee-email-input"
              defaultValue={defaultValues?.email}
              aria-invalid={!!fieldError("email")}
              aria-describedby={fieldError("email") ? "email-error" : undefined}
              required
            />
          </Field>
          <Field id="phone" label="Phone" error={fieldError("phone")}>
            <Input
              id="phone"
              name="phone"
              data-testid="employee-phone-input"
              defaultValue={defaultValues?.phone ?? ""}
            />
          </Field>
          <Field id="gender" label="Gender">
            <Select name="gender" defaultValue={defaultValues?.gender ?? undefined}>
              <SelectTrigger id="gender" data-testid="employee-gender-select" className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field id="dateOfBirth" label="Date of birth">
            <DatePicker
              id="dateOfBirth"
              name="dateOfBirth"
              data-testid="employee-dateOfBirth-input"
              defaultValue={defaultValues?.dateOfBirth}
            />
          </Field>
          <Field
            id="dateOfJoining"
            label="Date of joining"
            error={fieldError("dateOfJoining")}
          >
            <DatePicker
              id="dateOfJoining"
              name="dateOfJoining"
              data-testid="employee-dateOfJoining-input"
              defaultValue={defaultValues?.dateOfJoining}
              required
            />
          </Field>
          <Field id="departmentId" label="Department">
            <Select
              name="departmentId"
              defaultValue={defaultValues?.departmentId?.toString()}
            >
              <SelectTrigger id="departmentId" data-testid="employee-department-select" className="w-full">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="designationId" label="Designation">
            <Select
              name="designationId"
              defaultValue={defaultValues?.designationId?.toString()}
            >
              <SelectTrigger id="designationId" data-testid="employee-designation-select" className="w-full">
                <SelectValue placeholder="Select designation" />
              </SelectTrigger>
              <SelectContent>
                {designations.map((d) => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field id="address" label="Address" className="sm:col-span-2">
            <Textarea
              id="address"
              name="address"
              data-testid="employee-address-input"
              defaultValue={defaultValues?.address ?? ""}
              rows={2}
            />
          </Field>
          {showAdminOption ? (
            <div className="flex items-start gap-2 sm:col-span-2">
              <Checkbox
                id="isAdmin"
                name="isAdmin"
                data-testid="employee-isAdmin-checkbox"
                aria-describedby="isAdmin-description"
              />
              <div>
                <Label htmlFor="isAdmin">Grant admin access</Label>
                <p
                  id="isAdmin-description"
                  className="text-xs text-muted-foreground"
                >
                  Admin is just a role on this employee&apos;s own login — it
                  can be granted or removed later too.
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bank details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="bankName" label="Bank name">
            <Input
              id="bankName"
              name="bankName"
              data-testid="employee-bankName-input"
              defaultValue={defaultValues?.bankName ?? ""}
            />
          </Field>
          <Field id="bankAccountNumber" label="Account number">
            <Input
              id="bankAccountNumber"
              name="bankAccountNumber"
              data-testid="employee-bankAccountNumber-input"
              defaultValue={defaultValues?.bankAccountNumber ?? ""}
            />
          </Field>
          <Field id="ifsc" label="IFSC">
            <Input
              id="ifsc"
              name="ifsc"
              data-testid="employee-ifsc-input"
              defaultValue={defaultValues?.ifsc ?? ""}
            />
          </Field>
          <Field id="panNumber" label="PAN number">
            <Input
              id="panNumber"
              name="panNumber"
              data-testid="employee-panNumber-input"
              defaultValue={defaultValues?.panNumber ?? ""}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Monthly salary structure
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field id="basic" label="Basic" error={fieldError("basic")}>
            <Input
              id="basic"
              type="number"
              min={0}
              step="0.01"
              name="basic"
              data-testid="employee-basic-input"
              defaultValue={defaultValues?.basic}
              aria-invalid={!!fieldError("basic")}
              aria-describedby={fieldError("basic") ? "basic-error" : undefined}
              required
            />
          </Field>
          <Field id="hra" label="HRA">
            <Input
              id="hra"
              type="number"
              min={0}
              step="0.01"
              name="hra"
              data-testid="employee-hra-input"
              defaultValue={defaultValues?.hra ?? "0"}
            />
          </Field>
          <Field id="conveyance" label="Conveyance">
            <Input
              id="conveyance"
              type="number"
              min={0}
              step="0.01"
              name="conveyance"
              data-testid="employee-conveyance-input"
              defaultValue={defaultValues?.conveyance ?? "0"}
            />
          </Field>
          <Field id="medicalAllowance" label="Medical allowance">
            <Input
              id="medicalAllowance"
              type="number"
              min={0}
              step="0.01"
              name="medicalAllowance"
              data-testid="employee-medicalAllowance-input"
              defaultValue={defaultValues?.medicalAllowance ?? "0"}
            />
          </Field>
          <Field id="specialAllowance" label="Special allowance">
            <Input
              id="specialAllowance"
              type="number"
              min={0}
              step="0.01"
              name="specialAllowance"
              data-testid="employee-specialAllowance-input"
              defaultValue={defaultValues?.specialAllowance ?? "0"}
            />
          </Field>
          <Field id="providentFund" label="Provident fund">
            <Input
              id="providentFund"
              type="number"
              min={0}
              step="0.01"
              name="providentFund"
              data-testid="employee-providentFund-input"
              defaultValue={defaultValues?.providentFund ?? "0"}
            />
          </Field>
          <Field id="professionalTax" label="Professional tax">
            <Input
              id="professionalTax"
              type="number"
              min={0}
              step="0.01"
              name="professionalTax"
              data-testid="employee-professionalTax-input"
              defaultValue={defaultValues?.professionalTax ?? "0"}
            />
          </Field>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isPending} data-testid="employee-form-submit">
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        {submitLabel}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const errorId = `${id}-error`;
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
