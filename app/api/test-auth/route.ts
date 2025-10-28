import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError } from "@/lib/errors";

export async function GET() {
  try {
    const admin = await requireAdmin();

    return NextResponse.json({
      status: "success",
      authenticated: true,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      env: {
        hasNextAuthUrl: Boolean(process.env.NEXTAUTH_URL),
        hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
        nodeEnv: process.env.NODE_ENV,
        vercelDeploymentConfigured: Boolean(process.env.VERCEL_URL),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
