import "dotenv/config";
import { defineConfig, env } from "prisma/config";

function resolveMigrationDatasourceUrl() {
  try {
    return env("DIRECT_URL");
  } catch {
    return env("DATABASE_URL");
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: resolveMigrationDatasourceUrl(),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "npm run prisma:seed",
  },
});
