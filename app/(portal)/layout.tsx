import {
  LayoutDashboard,
  CalendarClock,
  Receipt,
  User,
  Users,
  CalendarCheck,
  Banknote,
} from "lucide-react";
import { requireSession } from "@/lib/session";
import { AppShell, type NavItem } from "@/components/layout/app-shell";

const iconProps = { className: "size-4", "aria-hidden": true } as const;

const BASE_NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: <LayoutDashboard {...iconProps} />,
    exact: true,
  },
  {
    href: "/attendance",
    label: "My Attendance",
    icon: <CalendarClock {...iconProps} />,
  },
  { href: "/payslips", label: "My Payslips", icon: <Receipt {...iconProps} /> },
  { href: "/profile", label: "Profile", icon: <User {...iconProps} /> },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/employees", label: "Employees", icon: <Users {...iconProps} /> },
  {
    href: "/team-attendance",
    label: "Team Attendance",
    icon: <CalendarCheck {...iconProps} />,
  },
  { href: "/payroll", label: "Payroll", icon: <Banknote {...iconProps} /> },
];

export default async function PortalLayout({
  children,
}: LayoutProps<"/">) {
  const session = await requireSession();
  const isAdmin = session.user.role === "admin";

  const navItems = isAdmin
    ? [...BASE_NAV_ITEMS, ...ADMIN_NAV_ITEMS]
    : BASE_NAV_ITEMS;

  return (
    <AppShell
      navItems={navItems}
      userEmail={session.user.email ?? ""}
      roleLabel={isAdmin ? "Administrator" : "Employee"}
    >
      {children}
    </AppShell>
  );
}
