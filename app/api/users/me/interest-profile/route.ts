import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { getInterestProfileForUser } from "@/lib/services/interest-profile.service";

export async function GET() {
  try {
    const user = await requireAuth();
    const profile = await getInterestProfileForUser(user.id);
    return successResponse(profile);
  } catch (error) {
    return handleError(error);
  }
}
