import { z } from "zod";

export const genderValues = ["male", "female", "other"] as const;

export const employeeFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  departmentId: z.coerce.number().int().positive().optional(),
  designationId: z.coerce.number().int().positive().optional(),
  gender: z.enum(genderValues).optional(),
  dateOfBirth: z.string().optional().or(z.literal("")),
  dateOfJoining: z.string().min(1, "Date of joining is required"),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  bankAccountNumber: z.string().trim().max(40).optional().or(z.literal("")),
  bankName: z.string().trim().max(120).optional().or(z.literal("")),
  ifsc: z.string().trim().max(20).optional().or(z.literal("")),
  panNumber: z.string().trim().max(20).optional().or(z.literal("")),
  basic: z.coerce.number().min(0, "Basic must be 0 or more"),
  hra: z.coerce.number().min(0).default(0),
  conveyance: z.coerce.number().min(0).default(0),
  medicalAllowance: z.coerce.number().min(0).default(0),
  specialAllowance: z.coerce.number().min(0).default(0),
  providentFund: z.coerce.number().min(0).default(0),
  professionalTax: z.coerce.number().min(0).default(0),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export function parseEmployeeFormData(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  return employeeFormSchema.safeParse(raw);
}
