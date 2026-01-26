import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { auth } from "@/lib/auth-edge";

// Protected routes requiring authentication
const protectedRoutes = ["/profile", "/challenges", "/friends", "/notifications"];

// Admin-only routes
const adminRoutes = ["/admin"];

// Public routes (no auth needed) — kept for visibility / future use
const _publicRoutes = ["/", "/auth", "/quizzes", "/topics", "/leaderboard", "/search", "/showcase"];

// ============================================================================
// RATE LIMITING
// ============================================================================

// In-memory rate limit store
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  api: { maxRequests: 200, windowMs: 60000 }, // 200 req/min for general API
  admin: { maxRequests: 100, windowMs: 60000 }, // 100 req/min for admin
  auth: { maxRequests: 20, windowMs: 60000 }, // 20 req/min for auth
};

// Cleanup old entries periodically
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60 * 1000;

function cleanupRateLimitStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
  lastCleanup = now;
}

function checkRateLimit(
  key: string,
  config: { maxRequests: number; windowMs: number }
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanupRateLimitStore();

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Enable XSS filter
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

// ============================================================================
// ALLOWED ORIGINS
// ============================================================================

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

// ============================================================================
// MAIN PROXY FUNCTION
// ============================================================================

export default auth(async function proxy(req: NextAuthRequest) {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  // NextAuth handles token parsing so req.auth stays in sync with auth.ts config (cookie names, secret).
  const session = req.auth;

  // Handle CORS preflight
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

  // ============================================================================
  // RATE LIMITING FOR API ROUTES
  // ============================================================================

  if (pathname.startsWith("/api")) {
    const clientIP = getClientIP(req);

    // Determine rate limit config based on route
    let config = RATE_LIMIT_CONFIG.api;
    let prefix = "api";

    if (pathname.startsWith("/api/admin")) {
      config = RATE_LIMIT_CONFIG.admin;
      prefix = "admin";
    } else if (pathname.startsWith("/api/auth")) {
      config = RATE_LIMIT_CONFIG.auth;
      prefix = "auth";
    }

    const rateLimitKey = `${prefix}:${clientIP}`;
    const { allowed, remaining: _remaining, resetAt } = checkRateLimit(rateLimitKey, config);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((resetAt - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(resetAt),
          },
        }
      );
    }
  }

  // ============================================================================
  // AUTHENTICATION CHECKS
  // ============================================================================

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

  // ============================================================================
  // CSRF/ORIGIN PROTECTION
  // ============================================================================

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

  // ============================================================================
  // ADD SECURITY HEADERS TO RESPONSE
  // ============================================================================

  const response = NextResponse.next();
  addSecurityHeaders(response);

  // Add rate limit headers to API responses
  if (pathname.startsWith("/api")) {
    const clientIP = getClientIP(req);
    let config = RATE_LIMIT_CONFIG.api;

    if (pathname.startsWith("/api/admin")) {
      config = RATE_LIMIT_CONFIG.admin;
    } else if (pathname.startsWith("/api/auth")) {
      config = RATE_LIMIT_CONFIG.auth;
    }

    const entry = rateLimitStore.get(`api:${clientIP}`);
    if (entry) {
      response.headers.set("X-RateLimit-Limit", String(config.maxRequests));
      response.headers.set("X-RateLimit-Remaining", String(Math.max(0, config.maxRequests - entry.count)));
      response.headers.set("X-RateLimit-Reset", String(entry.resetAt));
    }
  }

  return response;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
