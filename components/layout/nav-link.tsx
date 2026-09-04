"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function slugify(label: string) {
  return label.toLowerCase().replace(/\s+/g, "-");
}

export function NavLink({
  href,
  label,
  icon,
  exact,
}: {
  href: string;
  label: string;
  // A pre-rendered icon element, not a component reference — component
  // functions aren't serializable across the server -> client boundary.
  icon: ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      data-testid={`nav-link-${slugify(label)}`}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
