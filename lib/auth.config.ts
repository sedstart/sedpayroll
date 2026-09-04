import type { NextAuthConfig } from "next-auth";

const ADMIN_ONLY_PREFIXES = ["/employees", "/team-attendance", "/payroll"];

/**
 * Edge/proxy-safe Auth.js config: no providers (no DB, no bcrypt) here so the
 * `proxy.ts` bundle stays lightweight. The `authorized` callback runs on every
 * matched request purely against the JWT already decoded into `auth`.
 *
 * The whole app is one shared portal — every authenticated user (admin or
 * employee) reaches the same routes. Admin is just a role flag that unlocks
 * a few extra, admin-only sections (see ADMIN_ONLY_PREFIXES).
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  // Vercel's serverless/edge runtime doesn't always expose the `VERCEL` env
  // var to the function process, which is what Auth.js otherwise uses to
  // auto-trust the host — without this, sign-in fails with `UntrustedHost`.
  // Trusting the host here (rather than pinning a static AUTH_URL) also
  // keeps preview deployments, each on their own generated URL, working.
  trustHost: true,
  providers: [],
  callbacks: {
    // Pure token -> session field mapping, no DB access — shared by both the
    // full auth instance (lib/auth.ts) and the lightweight one the proxy
    // builds directly from this config, so `session.user.role` /
    // `employeeId` are populated whichever instance decodes the JWT.
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.employeeId = token.employeeId;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const { pathname } = nextUrl;

      if (pathname === "/login") {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      if (!isLoggedIn) return false;

      const isAdminOnlyRoute = ADMIN_ONLY_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
      );
      if (isAdminOnlyRoute && role !== "admin") {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
