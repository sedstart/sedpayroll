import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "admin" | "employee";
    employeeId: number;
  }

  interface Session {
    user: {
      role: "admin" | "employee";
      employeeId: number;
    } & DefaultSession["user"];
  }
}

// next-auth/jwt.d.ts re-exports JWT from @auth/core/jwt via `export *`, and
// the NextAuthConfig callbacks are typed against the @auth/core original —
// augmenting only "next-auth/jwt" does not merge into that, so target both.
declare module "next-auth/jwt" {
  interface JWT {
    role: "admin" | "employee";
    employeeId: number;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: "admin" | "employee";
    employeeId: number;
  }
}
