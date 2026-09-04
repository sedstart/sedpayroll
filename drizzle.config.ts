import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

if (!process.env.DB_DATABASE_URL) {
  throw new Error("DB_DATABASE_URL environment variable is not set");
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DB_DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
