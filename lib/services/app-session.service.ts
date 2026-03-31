import "server-only";

import { auth } from "@/lib/auth";

export async function getOptionalSession(context: string) {
  try {
    return await auth();
  } catch (error) {
    console.error("[auth:optional-session-fallback]", {
      context,
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return null;
  }
}
