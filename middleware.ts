import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/lib/auth";

// Protected routes requiring authentication
const protectedRoutes = ["/profile", "/challenges", "/friends", "/notifications"];

// Admin-only routes
const adminRoutes = ["/admin"];

// Public routes (no auth needed) — kept for visibility / future use
const _publicRoutes = ["/", "/auth", "/quizzes", "/topics", "/leaderboard", "/search", "/showcase"];

function getAllowedOrigins(request: NextRequest): Set<string> {
  const origins = new Set<string>();
  const currentOrigin = request.nextUrl.origin.replace(/\/$/, "");
  origins.add(currentOrigin);

  const envOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter(Boolean) as string[];

  for (const origin of envOrigins) {
    origins.add(origin.replace(/\/$/, ""));
  }

  return origins;
}

export default auth(async function middleware(req: NextAuthRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // NextAuth handles token parsing so req.auth stays in sync with auth.ts config (cookie names, secret).
  const session = req.auth;

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route.replace("*", ""))
  );
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isQuizPlayRoute = Boolean(pathname.match(/^\/quizzes\/[^/]+\/play/));

  if ((isProtectedRoute || isAdminRoute || isQuizPlayRoute) && !session) {
    const signInUrl = new URL("/auth/signin", req.url);
    // Preserve the path (and any query) so users land back where they started.
    const callbackPath = `${pathname}${nextUrl.search}`;
    signInUrl.searchParams.set("callbackUrl", callbackPath);
    return NextResponse.redirect(signInUrl);
  }

  if (isAdminRoute && !(session && session.user?.role === "ADMIN")) {
    return NextResponse.redirect(new URL("/auth/unauthorized", req.url));
  }

  const isMutatingMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  const isApiRoute = pathname.startsWith("/api/");

  if (isMutatingMethod && isApiRoute) {
    const origin = req.headers.get("origin");
    const allowedOrigins = getAllowedOrigins(req);

    if (origin) {
      const normalizedOrigin = origin.replace(/\/$/, "");
      if (!allowedOrigins.has(normalizedOrigin)) {
        return NextResponse.json(
          { success: false, error: "Invalid request origin", code: "FORBIDDEN_ORIGIN" },
          { status: 403 }
        );
      }
    } else {
      const referer = req.headers.get("referer");
      if (!referer) {
        return NextResponse.json(
          { success: false, error: "Missing request origin", code: "FORBIDDEN_ORIGIN" },
          { status: 403 }
        );
      }

      try {
        const refererOrigin = new URL(referer).origin.replace(/\/$/, "");
        if (!allowedOrigins.has(refererOrigin)) {
          return NextResponse.json(
            { success: false, error: "Invalid referer header", code: "FORBIDDEN_ORIGIN" },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid referer header", code: "FORBIDDEN_ORIGIN" },
          { status: 403 }
        );
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
