import { defineConfig } from "drizzle-kit";

// Migrations must run over the DIRECT (non -pooler) connection.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
});
