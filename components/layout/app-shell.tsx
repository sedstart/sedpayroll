import type { ReactNode } from "react";
import { Wallet2 } from "lucide-react";
import { NavLink } from "@/components/layout/nav-link";
import { SignOutButton } from "@/components/layout/sign-out-button";
import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar";

export type NavItem = {
  href: string;
  label: string;
  // A pre-rendered icon element (e.g. <Users className="size-4" />), not a
  // component reference — component functions can't cross the server ->
  // client boundary as props.
  icon: ReactNode;
  exact?: boolean;
};

function initialsFromEmail(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export function AppShell({
  navItems,
  userEmail,
  roleLabel,
  children,
}: {
  navItems: NavItem[];
  userEmail: string;
  roleLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:z-50 focus-visible:m-2 focus-visible:rounded-md focus-visible:bg-primary focus-visible:px-4 focus-visible:py-2 focus-visible:text-primary-foreground"
      >
        Skip to main content
      </a>
      <aside
        className="hidden h-full w-64 shrink-0 flex-col border-r bg-background md:flex"
        data-testid="sidebar"
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
          <Wallet2 className="size-5 text-primary" aria-hidden="true" />
          <span className="font-semibold">SedPayroll</span>
        </div>
        <nav
          aria-label="Primary navigation"
          data-testid="sidebar-nav"
          className="flex flex-1 flex-col gap-1 overflow-y-auto p-3"
        >
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-3 border-t p-4">
          <Avatar className="size-8">
            <AvatarFallback aria-hidden="true">
              {initialsFromEmail(userEmail)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-medium"
              data-testid="current-user-email"
            >
              {userEmail}
            </p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
      </aside>
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-8">
          <nav
            aria-label="Mobile navigation"
            data-testid="mobile-nav"
            className="flex gap-1 overflow-x-auto md:hidden"
          >
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground md:inline">
              {userEmail}
            </span>
            <SignOutButton />
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 md:p-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
