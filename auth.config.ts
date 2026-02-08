import type { NextAuthConfig } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export default {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, transfer user ID and role to token
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      // Otherwise, just return the existing token (which should already have id and role from lib/auth.ts)
      return token;
    },
    async session({ session, token }) {
      // Transfer user ID and role from token to session
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as import("@prisma/client").UserRole;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
} satisfies NextAuthConfig
