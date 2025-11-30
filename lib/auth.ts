import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import { UserRole } from "@prisma/client";
import authConfig from "../auth.config";

// Use NEXTAUTH_URL if set, otherwise construct from VERCEL_URL
function getAuthUrl() {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3200";
}

// Normalize providers to avoid NextAuth internals calling .map on undefined.
const providers = Array.isArray(authConfig.providers)
  ? authConfig.providers
  : authConfig.providers
    ? [authConfig.providers]
    : [];

if (providers.length === 0) {
  // Surface a clear log so it is obvious why auth would fail at runtime.
  console.warn("[auth] No providers configured. Check auth.config.ts or environment vars.");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user, trigger, session: updateData }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        // Fetch user role from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = dbUser?.role || UserRole.USER;
      }
      // Handle session update
      if (trigger === "update" && updateData?.role) {
        token.role = updateData.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole || UserRole.USER;
      }
      return session;
    },
    async redirect({ url }) {
      // Use the dynamically determined auth URL
      const base = getAuthUrl();
      
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${base}${url}`;
      // Allows callback URLs on the same origin
      try {
        const urlOrigin = new URL(url).origin;
        const baseOrigin = new URL(base).origin;
        if (urlOrigin === baseOrigin) return url;
      } catch {
        // If URL parsing fails, return base
        return base;
      }
      return base;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,   // Update session every 24 hours
  },
  debug: process.env.NODE_ENV !== "production",
  trustHost: true,
});
