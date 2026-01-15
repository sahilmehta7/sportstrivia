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

// Create Prisma client with appropriate configuration
function createPrismaClient(): PrismaClient {
  // Validate DATABASE_URL is present
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL environment variable is not defined. " +
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
