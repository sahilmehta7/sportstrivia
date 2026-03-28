import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { z } from "zod";
import {
  getUserInterestsAndPreferences,
  replaceUserInterestsBySource,
} from "@/lib/services/user-interest.service";
import type { InterestPreferenceSource } from "@prisma/client";

const preferencesSchema = z.object({
  preferredDifficulty: z.enum(["EASY", "MEDIUM", "HARD"]).nullable(),
  preferredPlayModes: z.array(z.enum(["STANDARD", "GRID_3X3"])),
});

const interestsUpdateSchema = z.union([
  z.object({
    topicIds: z.array(z.string().min(1)),
    source: z.enum(["ONBOARDING", "PROFILE", "ADMIN", "IMPORT"]),
    preferences: preferencesSchema,
  }),
  z.object({
    interests: z.array(
      z.object({
        topicId: z.string().min(1),
        source: z.enum(["ONBOARDING", "PROFILE", "ADMIN", "IMPORT"]).optional(),
        strength: z.number().min(0).max(1).or(z.number().max(100)).optional(),
      })
    ),
    preferences: preferencesSchema,
  }),
]);

function normalizeInterestsPayload(
  payload: z.infer<typeof interestsUpdateSchema>
): { topicIds: string[]; source: InterestPreferenceSource } {
  if ("topicIds" in payload) {
    return {
      topicIds: payload.topicIds,
      source: payload.source,
    };
  }

  return {
    topicIds: payload.interests.map((interest) => interest.topicId),
    source: payload.interests[0]?.source ?? "PROFILE",
  };
}

const groupedFollowableTypes = new Set([
  "SPORT",
  "SPORTS_TEAM",
  "ATHLETE",
  "SPORTS_EVENT",
  "SPORTS_ORGANIZATION",
]);

function toInterestResponseRow(entry: Awaited<ReturnType<typeof getUserInterestsAndPreferences>>["interests"][number]) {
  return {
    topicId: entry.topic.id,
    slug: entry.topic.slug,
    name: entry.topic.name,
    schemaType: entry.topic.schemaType,
    source: entry.source,
    strength: entry.strength,
    topic: entry.topic,
  };
}

export async function GET() {
  try {
    const user = await requireAuth();
    const payload = await getUserInterestsAndPreferences(user.id);

    return successResponse({
      interests: payload.interests
        .filter((interest) => groupedFollowableTypes.has(interest.topic.schemaType))
        .map(toInterestResponseRow),
      preferences: payload.preferences,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = interestsUpdateSchema.parse(await request.json());
    const normalized = normalizeInterestsPayload(body);

    const result = await replaceUserInterestsBySource({
      userId: user.id,
      topicIds: normalized.topicIds,
      source: normalized.source,
      preferences: {
        preferredDifficulty: body.preferences.preferredDifficulty,
        preferredPlayModes: body.preferences.preferredPlayModes,
      },
    });

    return successResponse({
      message: "Interests updated successfully",
      savedInterests: result.savedInterests.map((interest) => ({
        topicId: interest.topicId,
        source: interest.source,
        strength: interest.strength,
      })),
      droppedTopicIds: result.droppedTopicIds,
    });
  } catch (error) {
    return handleError(error);
  }
}
