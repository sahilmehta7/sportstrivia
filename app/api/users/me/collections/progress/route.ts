import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { listUserInProgressCollections } from "@/lib/services/collection.service";

export async function GET() {
  try {
    const user = await requireAuth();
    const items = await listUserInProgressCollections(user.id);
    return successResponse({ items });
  } catch (error) {
    return handleError(error);
  }
}
