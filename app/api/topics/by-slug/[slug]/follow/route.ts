import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import {
  followTopicForUser,
  resolveTopicIdFromSlug,
  unfollowTopicForUser,
} from "@/lib/services/user-follow.service";

// Compatibility alias during migration.
// Canonical endpoint: /api/topics/[id]/follow.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireAuth();
    const { slug } = await params;
    const topicId = await resolveTopicIdFromSlug(slug);
    const result = await followTopicForUser(user.id, topicId);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await requireAuth();
    const { slug } = await params;
    const topicId = await resolveTopicIdFromSlug(slug);
    const result = await unfollowTopicForUser(user.id, topicId);
    return successResponse(result);
  } catch (error) {
    return handleError(error);
  }
}
