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

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveRuntimeDatabaseUrl(): string | undefined {
  const directUrl = process.env.DIRECT_URL;
  const runtimeUrl = process.env.DATABASE_URL;
  const forceDirect = process.env.PRISMA_RUNTIME_USE_DIRECT_URL === "true";

  if (forceDirect && directUrl) {
    console.warn(
      "[db] PRISMA_RUNTIME_USE_DIRECT_URL=true; using DIRECT_URL for runtime Prisma traffic"
    );
    process.env.DATABASE_URL = directUrl;
    return directUrl;
  }

  if (!runtimeUrl && directUrl) {
    console.warn("[db] DATABASE_URL missing; falling back to DIRECT_URL");
    process.env.DATABASE_URL = directUrl;
    return directUrl;
  }

  return runtimeUrl;
}

// Create Prisma client with appropriate configuration
function createPrismaClient(): PrismaClient {
  // Validate DATABASE_URL (or DIRECT_URL fallback) is present
  const resolvedDbUrl = resolveRuntimeDatabaseUrl();
  if (!resolvedDbUrl) {
    throw new Error(
      "DATABASE_URL environment variable is not defined (and DIRECT_URL fallback is unavailable). " +
      "Please set it in your .env file or environment configuration."
    );
  }

  return new PrismaClient({
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
