import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { listFollowedTopicsForUser } from "@/lib/services/user-follow.service";

export async function GET() {
  try {
    const user = await requireAuth();
    const payload = await listFollowedTopicsForUser(user.id);

    return successResponse({
      ...payload.grouped,
      follows: payload.flat,
    });
  } catch (error) {
    return handleError(error);
  }
}
