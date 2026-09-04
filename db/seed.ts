import { config } from "dotenv";
config({ path: ".env.local" });

// Static imports of anything touching DB_DATABASE_URL must come after the
// dotenv config() call above runs, so they are loaded dynamically inside
// main() below instead of at the top of the module.

const DEPARTMENTS = ["Engineering", "Human Resources", "Sales", "Finance"];
const DESIGNATIONS = [
  "Software Engineer",
  "Senior Software Engineer",
  "HR Manager",
  "Sales Executive",
  "Accountant",
  "Engineering Manager",
];

type SeedEmployee = {
  firstName: string;
  lastName: string;
  department: string;
  designation: string;
  gender: "male" | "female" | "other";
  monthsAgoJoined: number;
  basic: number;
  hra: number;
  conveyance: number;
  medicalAllowance: number;
  specialAllowance: number;
  providentFund: number;
  professionalTax: number;
  /**
   * Admin is just a role flag on an employee's own login — no separate
   * "admin account" concept. A couple of senior employees get it seeded on.
   */
  isAdmin?: boolean;
};

const SEED_EMPLOYEES: SeedEmployee[] = [
  {
    firstName: "Aditi",
    lastName: "Sharma",
    department: "Engineering",
    designation: "Senior Software Engineer",
    gender: "female",
    monthsAgoJoined: 26,
    basic: 60000,
    hra: 24000,
    conveyance: 3000,
    medicalAllowance: 2000,
    specialAllowance: 11000,
    providentFund: 7200,
    professionalTax: 200,
  },
  {
    firstName: "Rohan",
    lastName: "Verma",
    department: "Engineering",
    designation: "Software Engineer",
    gender: "male",
    monthsAgoJoined: 14,
    basic: 45000,
    hra: 18000,
    conveyance: 2000,
    medicalAllowance: 1500,
    specialAllowance: 8500,
    providentFund: 5400,
    professionalTax: 200,
  },
  {
    firstName: "Neha",
    lastName: "Iyer",
    department: "Engineering",
    designation: "Engineering Manager",
    gender: "female",
    monthsAgoJoined: 40,
    basic: 90000,
    hra: 36000,
    conveyance: 3000,
    medicalAllowance: 2000,
    specialAllowance: 19000,
    providentFund: 10800,
    professionalTax: 200,
    isAdmin: true,
  },
  {
    firstName: "Karan",
    lastName: "Mehta",
    department: "Sales",
    designation: "Sales Executive",
    gender: "male",
    monthsAgoJoined: 8,
    basic: 35000,
    hra: 14000,
    conveyance: 2000,
    medicalAllowance: 1500,
    specialAllowance: 6000,
    providentFund: 4200,
    professionalTax: 200,
  },
  {
    firstName: "Priya",
    lastName: "Nair",
    department: "Sales",
    designation: "Sales Executive",
    gender: "female",
    monthsAgoJoined: 20,
    basic: 38000,
    hra: 15200,
    conveyance: 2000,
    medicalAllowance: 1500,
    specialAllowance: 6800,
    providentFund: 4560,
    professionalTax: 200,
  },
  {
    firstName: "Vikram",
    lastName: "Rao",
    department: "Finance",
    designation: "Accountant",
    gender: "male",
    monthsAgoJoined: 32,
    basic: 42000,
    hra: 16800,
    conveyance: 2000,
    medicalAllowance: 1500,
    specialAllowance: 7200,
    providentFund: 5040,
    professionalTax: 200,
  },
  {
    firstName: "Sanya",
    lastName: "Kapoor",
    department: "Human Resources",
    designation: "HR Manager",
    gender: "female",
    monthsAgoJoined: 50,
    basic: 55000,
    hra: 22000,
    conveyance: 3000,
    medicalAllowance: 2000,
    specialAllowance: 10000,
    providentFund: 6600,
    professionalTax: 200,
    isAdmin: true,
  },
  {
    firstName: "Arjun",
    lastName: "Desai",
    department: "Engineering",
    designation: "Software Engineer",
    gender: "male",
    monthsAgoJoined: 5,
    basic: 43000,
    hra: 17200,
    conveyance: 2000,
    medicalAllowance: 1500,
    specialAllowance: 7800,
    providentFund: 5160,
    professionalTax: 200,
  },
];

function monthsAgo(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().slice(0, 10);
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function main() {
  const bcrypt = (await import("bcryptjs")).default;
  const { db } = await import("./index");
  const {
    departments,
    designations,
    employees,
    users,
    attendance,
    salaryStructures,
    payrollRuns,
  } = await import("./schema");
  const { runPayrollForMonth } = await import("../lib/payroll");

  console.log("Seeding database…");

  // Wipe existing data (order matters for FKs).
  await db.delete(payrollRuns);
  await db.delete(attendance);
  await db.delete(salaryStructures);
  await db.delete(users);
  await db.delete(employees);
  await db.delete(designations);
  await db.delete(departments);

  const departmentRows = await db
    .insert(departments)
    .values(DEPARTMENTS.map((name) => ({ name })))
    .returning();
  const departmentByName = new Map(departmentRows.map((d) => [d.name, d.id]));

  const designationRows = await db
    .insert(designations)
    .values(DESIGNATIONS.map((title) => ({ title })))
    .returning();
  const designationByTitle = new Map(
    designationRows.map((d) => [d.title, d.id])
  );

  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const employeePasswordHash = await bcrypt.hash("Employee@123", 10);

  let firstAdminUserId: number | undefined;
  let empCounter = 1;
  for (const seedEmp of SEED_EMPLOYEES) {
    const employeeCode = `EMP${String(empCounter).padStart(3, "0")}`;
    empCounter++;

    const email = `${seedEmp.firstName.toLowerCase()}.${seedEmp.lastName.toLowerCase()}@sedpayroll.com`;

    const [employee] = await db
      .insert(employees)
      .values({
        employeeCode,
        firstName: seedEmp.firstName,
        lastName: seedEmp.lastName,
        email,
        phone: `9${Math.floor(100000000 + Math.random() * 899999999)}`,
        departmentId: departmentByName.get(seedEmp.department),
        designationId: designationByTitle.get(seedEmp.designation),
        gender: seedEmp.gender,
        dateOfBirth: monthsAgo(seedEmp.monthsAgoJoined + 300),
        dateOfJoining: monthsAgo(seedEmp.monthsAgoJoined),
        status: "active",
        address: "Bengaluru, India",
        bankAccountNumber: `${Math.floor(
          1000000000 + Math.random() * 8999999999
        )}`,
        bankName: "HDFC Bank",
        ifsc: "HDFC0001234",
        panNumber: `ABCDE${Math.floor(1000 + Math.random() * 8999)}F`,
      })
      .returning();

    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash: seedEmp.isAdmin ? adminPasswordHash : employeePasswordHash,
        role: seedEmp.isAdmin ? "admin" : "employee",
        employeeId: employee.id,
      })
      .returning();

    if (seedEmp.isAdmin && !firstAdminUserId) firstAdminUserId = user.id;

    await db.insert(salaryStructures).values({
      employeeId: employee.id,
      effectiveFrom: monthsAgo(seedEmp.monthsAgoJoined),
      basic: seedEmp.basic.toString(),
      hra: seedEmp.hra.toString(),
      conveyance: seedEmp.conveyance.toString(),
      medicalAllowance: seedEmp.medicalAllowance.toString(),
      specialAllowance: seedEmp.specialAllowance.toString(),
      providentFund: seedEmp.providentFund.toString(),
      professionalTax: seedEmp.professionalTax.toString(),
      ctc: (
        (seedEmp.basic +
          seedEmp.hra +
          seedEmp.conveyance +
          seedEmp.medicalAllowance +
          seedEmp.specialAllowance) *
        12
      ).toString(),
    });

    // ~30 days of attendance, weekends off, ~90% present, some half-days/leave.
    const today = new Date();
    for (let i = 30; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const day = date.getDay();
      if (day === 0 || day === 6) continue; // skip weekends

      const roll = Math.random();
      let status: "present" | "absent" | "half_day" | "on_leave" = "present";
      if (roll < 0.06) status = "absent";
      else if (roll < 0.1) status = "half_day";
      else if (roll < 0.13) status = "on_leave";

      if (status === "absent") continue; // no clock-in row for absentees

      const clockInHour = 9 + Math.floor(Math.random() * 1); // 9-10am
      const clockInMinute = Math.floor(Math.random() * 60);
      const clockIn = new Date(date);
      clockIn.setHours(clockInHour, clockInMinute, 0, 0);

      let clockOut: Date | null = null;
      if (status !== "on_leave") {
        clockOut = new Date(clockIn);
        const hoursWorked = status === "half_day" ? 4 : 8 + Math.random();
        clockOut.setHours(
          clockIn.getHours() + Math.floor(hoursWorked),
          clockIn.getMinutes() + Math.round((hoursWorked % 1) * 60)
        );
      }

      await db.insert(attendance).values({
        employeeId: employee.id,
        date: isoDate(date),
        clockIn,
        clockOut,
        status,
      });
    }

    console.log(
      `${seedEmp.isAdmin ? "Admin" : "Employee"} created: ${email} / ${
        seedEmp.isAdmin ? "Admin@123" : "Employee@123"
      }`
    );
  }

  // One already-processed payroll run for last month.
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = lastMonthDate.getMonth() + 1;
  const lastYear = lastMonthDate.getFullYear();

  const [run] = await db
    .insert(payrollRuns)
    .values({
      month: lastMonth,
      year: lastYear,
      status: "processed",
      processedAt: new Date(),
      processedBy: firstAdminUserId,
    })
    .returning();

  await runPayrollForMonth(lastMonth, lastYear, run.id);
  console.log(`Payroll run generated for ${lastMonth}/${lastYear}`);

  console.log("\nSeed complete.");
  console.log("Admin logins:   neha.iyer@sedpayroll.com / Admin@123");
  console.log("                sanya.kapoor@sedpayroll.com / Admin@123");
  console.log("Employee login: <firstname>.<lastname>@sedpayroll.com / Employee@123");
  console.log("e.g. aditi.sharma@sedpayroll.com / Employee@123");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
