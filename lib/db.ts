import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton
 * 
 * This module exports a single Prisma client instance that is reused across
 * the application. In development, it's stored on globalThis to prevent
 * multiple instances during hot reloading.
 * 
 * Configuration:
 * - DATABASE_URL must be set in all environments
 * - Logging is more verbose in development
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with appropriate configuration
function createPrismaClient(): PrismaClient {
  const directUrl = process.env.DIRECT_URL;
  const databaseUrl = process.env.DATABASE_URL;

  // Runtime traffic should use DATABASE_URL (typically pooled/transaction mode).
  // DIRECT_URL is intended for migrations and maintenance commands.
  const forceDirect = process.env.PRISMA_RUNTIME_USE_DIRECT_URL === "true";
  const connectionString = forceDirect
    ? directUrl || databaseUrl
    : databaseUrl || directUrl;

  if (forceDirect && directUrl) {
    console.warn(
      "[db] PRISMA_RUNTIME_USE_DIRECT_URL=true; using DIRECT_URL for runtime Prisma traffic"
    );
  } else if (!databaseUrl && directUrl) {
    console.warn("[db] DATABASE_URL missing; falling back to DIRECT_URL for runtime");
  }

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL or DIRECT_URL environment variable is not defined."
    );
  }

  const isServerless =
    !!process.env.VERCEL ||
    !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
    !!process.env.K_SERVICE;
  const defaultPoolMax = isServerless ? 1 : 3;

  const pool = new Pool({
    connectionString,
    max: parseInt(process.env.DB_MAX_CONNECTIONS || String(defaultPoolMax), 10),
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 10000,
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
      ? ["error", "warn"]
      : ["error"],
  });
}

// Use existing client or create new one
const prismaClient = globalForPrisma.prisma ?? createPrismaClient();

// Export singleton
export const prisma = prismaClient;

// Store on globalThis in development to prevent multiple instances during hot reload
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaClient;
}

export const db = prisma;
