import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { getInterestProfileForUser } from "@/lib/services/interest-profile.service";

export async function GET() {
  try {
    const user = await requireAuth();
    const profile = await getInterestProfileForUser(user.id);
    return successResponse({
      ...profile,
      meta: {
        gateBSignals: {
          interestProfileGenerated: true,
          contractVersion: profile.contractVersion,
        },
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
