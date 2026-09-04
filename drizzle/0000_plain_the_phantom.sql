CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'half_day', 'on_leave');--> statement-breakpoint
CREATE TYPE "public"."employee_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."payroll_status" AS ENUM('draft', 'processed', 'paid');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'employee');--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"date" date NOT NULL,
	"clock_in" timestamp with time zone,
	"clock_out" timestamp with time zone,
	"status" "attendance_status" DEFAULT 'present' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "designations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(120) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "designations_title_unique" UNIQUE("title")
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_code" varchar(20) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"department_id" integer,
	"designation_id" integer,
	"gender" "gender",
	"date_of_birth" date,
	"date_of_joining" date NOT NULL,
	"date_of_leaving" date,
	"status" "employee_status" DEFAULT 'active' NOT NULL,
	"address" text,
	"bank_account_number" varchar(40),
	"bank_name" varchar(120),
	"ifsc" varchar(20),
	"pan_number" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "employees_employee_code_unique" UNIQUE("employee_code"),
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"status" "payroll_status" DEFAULT 'draft' NOT NULL,
	"processed_at" timestamp with time zone,
	"processed_by" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payslips" (
	"id" serial PRIMARY KEY NOT NULL,
	"payroll_run_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"days_present" numeric(5, 1) NOT NULL,
	"days_in_month" integer NOT NULL,
	"gross_earnings" numeric(12, 2) NOT NULL,
	"total_deductions" numeric(12, 2) NOT NULL,
	"net_pay" numeric(12, 2) NOT NULL,
	"breakdown" jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_structures" (
	"id" serial PRIMARY KEY NOT NULL,
	"employee_id" integer NOT NULL,
	"effective_from" date NOT NULL,
	"basic" numeric(12, 2) NOT NULL,
	"hra" numeric(12, 2) DEFAULT '0' NOT NULL,
	"conveyance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"medical_allowance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"special_allowance" numeric(12, 2) DEFAULT '0' NOT NULL,
	"provident_fund" numeric(12, 2) DEFAULT '0' NOT NULL,
	"professional_tax" numeric(12, 2) DEFAULT '0' NOT NULL,
	"ctc" numeric(12, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'employee' NOT NULL,
	"employee_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_designation_id_designations_id_fk" FOREIGN KEY ("designation_id") REFERENCES "public"."designations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_runs" ADD CONSTRAINT "payroll_runs_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "salary_structures" ADD CONSTRAINT "salary_structures_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_employee_date_idx" ON "attendance" USING btree ("employee_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_runs_month_year_idx" ON "payroll_runs" USING btree ("month","year");