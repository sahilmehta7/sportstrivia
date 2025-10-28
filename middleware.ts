import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export function middleware(request: NextRequest) {
  const { method, nextUrl, headers } = request;
  const pathname = nextUrl.pathname;

  const isMutatingMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const isApiRoute = pathname.startsWith("/api/");

  if (!isMutatingMethod || !isApiRoute) {
    return NextResponse.next();
  }

  const origin = headers.get("origin");
  const allowedOrigins = getAllowedOrigins(request);

  if (origin) {
    const normalizedOrigin = origin.replace(/\/$/, "");
    if (!allowedOrigins.has(normalizedOrigin)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request origin",
          code: "FORBIDDEN_ORIGIN",
        },
        { status: 403 }
      );
    }
  } else {
    const referer = headers.get("referer");
    if (!referer) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing request origin",
          code: "FORBIDDEN_ORIGIN",
        },
        { status: 403 }
      );
    }

    try {
      const refererOrigin = new URL(referer).origin.replace(/\/$/, "");
      if (!allowedOrigins.has(refererOrigin)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request origin",
            code: "FORBIDDEN_ORIGIN",
          },
          { status: 403 }
        );
      }
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid referer header",
          code: "FORBIDDEN_ORIGIN",
        },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
