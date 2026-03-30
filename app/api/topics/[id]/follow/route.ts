import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { followTopicForUser, unfollowTopicForUser } from "@/lib/services/user-follow.service";

// Canonical follow endpoint during migration.
// Compatibility aliases: /api/topics/by-id/[id]/follow and /api/topics/by-slug/[slug]/follow.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const result = await followTopicForUser(user.id, id);
    return successResponse({
      ...result,
      meta: {
        gateBSignals: {
          followMutationSuccess: true,
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
    const result = await unfollowTopicForUser(user.id, id);
    return successResponse({
      ...result,
      meta: {
        gateBSignals: {
          followMutationSuccess: true,
          validationPolicy: "FOLLOWABLE_AND_READY",
          action: "UNFOLLOW",
        },
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
