import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { getPersonalizedHomePayload } from "@/lib/services/personalized-home.service";

export async function GET() {
  try {
    const user = await requireAuth();
    const payload = await getPersonalizedHomePayload(user.id);

    return successResponse({
      ...payload,
      meta: {
        personalizedHomePayloadLoaded: true,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
