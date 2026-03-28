import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
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

    revalidatePath("/sitemap.xml");
    
    return successResponse({
      message: "Sitemap cache invalidated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}
