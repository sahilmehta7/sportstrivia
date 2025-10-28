import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { getUserProfileStats } from "@/lib/services/user-profile.service";

// GET /api/users/me/stats - Get current user's detailed statistics
export async function GET() {
  try {
    const user = await requireAuth();

    const stats = await getUserProfileStats(user.id);

    return successResponse(stats);
  } catch (error) {
    return handleError(error);
  }
}
