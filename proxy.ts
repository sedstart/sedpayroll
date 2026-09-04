import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// A second, lightweight NextAuth instance built from the provider-less
// authConfig — keeps the DB client and bcrypt out of the proxy bundle while
// still gating every portal route (and admin-only sections) via the
// `authorized` callback (see lib/auth.config.ts).
export const { auth: proxy } = NextAuth(authConfig);

export default proxy;

export const config = {
  // Everything except the Auth.js API routes, static assets and metadata
  // files needs a session (or an admin role, for a few sub-paths).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
