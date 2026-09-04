import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// A single, standard Postgres connection string works for both the local
// docker-composed Postgres and Vercel Postgres (Neon-backed) in production.
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: process.env.NODE_ENV === "production" ? 5 : 10,
});

export const db = drizzle(client, { schema });
