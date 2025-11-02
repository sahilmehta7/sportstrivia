import { NextRequest } from "next/server";
import { z } from "zod";
import { NotificationDigestFrequency } from "@prisma/client";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import {
  getOrCreateNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/services/notification-preferences.service";

const updatePreferencesSchema = z.object({
  digestFrequency: z.nativeEnum(NotificationDigestFrequency).optional(),
  digestTimeOfDay: z.number().int().min(0).max(23).optional(),
  digestTimeZone: z.string().optional().nullable(),
  emailOptIn: z.boolean().optional(),
  pushOptIn: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();
    const preferences = await getOrCreateNotificationPreferences(user.id);
    return successResponse({ preferences });
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const updates = updatePreferencesSchema.parse(body);
    const preferences = await updateNotificationPreferences(user.id, updates);
    return successResponse({ preferences });
  } catch (error) {
    return handleError(error);
  }
}
