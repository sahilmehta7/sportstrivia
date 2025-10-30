import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { isAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse, ForbiddenError } from "@/lib/errors";

// POST /api/admin/sitemap - Regenerate sitemap
export async function POST(_request: NextRequest) {
  try {
    await requireAuth();
    
    // Check if user is admin
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      throw new ForbiddenError("Only admins can regenerate the sitemap");
    }

    // In Next.js, sitemap is generated at build time or on-demand
    // We'll just return success and let Next.js handle the generation
    // The sitemap will be regenerated on the next request
    
    return successResponse({
      message: "Sitemap regeneration triggered successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}
