import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { addInterestTopic, removeInterestTopic } from "@/lib/services/user-interest.service";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const result = await addInterestTopic(user.id, id, "PROFILE", 1);
    return successResponse({
      ...result,
      meta: {
        gateBSignals: {
          interestMutationSuccess: true,
          validationPolicy: "FOLLOWABLE_AND_READY",
          action: "FOLLOW",
        },
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const result = await removeInterestTopic(user.id, id);
    return successResponse({
      ...result,
      meta: {
        gateBSignals: {
          interestMutationSuccess: true,
          validationPolicy: "FOLLOWABLE_AND_READY",
          action: "UNFOLLOW",
        },
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

