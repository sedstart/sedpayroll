import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Proxy already gates every route (see lib/auth.config.ts), but Server
 * Actions are reachable directly via POST regardless of proxy matchers — so
 * every action (and every server component that renders sensitive data)
 * re-checks here.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  if (session.user.role !== "admin") redirect("/");
  return session;
}
