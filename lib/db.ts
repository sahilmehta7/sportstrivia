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
  
  // Use DIRECT_URL for the adapter if available, otherwise DATABASE_URL
  const connectionString = directUrl || databaseUrl;
  
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL or DIRECT_URL environment variable is not defined."
    );
  }

  const pool = new Pool({ 
    connectionString,
    max: parseInt(process.env.DB_MAX_CONNECTIONS || "3"), 
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
