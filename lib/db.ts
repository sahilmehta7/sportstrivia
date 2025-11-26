import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaFallback = () => {
  const modelHandler: ProxyHandler<any> = {
    get(_target, methodKey) {
      return async (...args: any[]) => {
        const methodName = String(methodKey);
        if (methodName.includes("count")) return 0;
        if (methodName.includes("findMany")) return [];
        if (methodName.includes("findFirst") || methodName.includes("findUnique")) return null;
        if (methodName.includes("create")) return args?.[0]?.data ?? args?.[0] ?? null;
        return null;
      };
    },
  };

  return new Proxy({}, {
    get(_target, modelKey) {
      return new Proxy({}, modelHandler);
    },
  }) as unknown as PrismaClient;
};

const prismaClient =
  globalForPrisma.prisma ??
  (process.env.DATABASE_URL
    ? new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
      })
    : createPrismaFallback());

export const prisma = prismaClient;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaClient;

