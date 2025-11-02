import type { NotificationDigestFrequency, UserNotificationPreference } from "@prisma/client";
import { prisma } from "@/lib/db";

export type NotificationPreferencesUpdate = Partial<{
  digestFrequency: NotificationDigestFrequency;
  digestTimeOfDay: number;
  digestTimeZone: string | null;
  emailOptIn: boolean;
  pushOptIn: boolean;
}>;

export async function getOrCreateNotificationPreferences(
  userId: string
): Promise<UserNotificationPreference> {
  const existing = await prisma.userNotificationPreference.findUnique({
    where: { userId },
  });

  if (existing) {
    return existing;
  }

  return prisma.userNotificationPreference.create({
    data: {
      userId,
    },
  });
}

export async function updateNotificationPreferences(
  userId: string,
  updates: NotificationPreferencesUpdate
): Promise<UserNotificationPreference> {
  await getOrCreateNotificationPreferences(userId);

  return prisma.userNotificationPreference.update({
    where: { userId },
    data: updates,
  });
}

export async function getUsersDueForDigest(
  frequency: NotificationDigestFrequency,
  referenceDate: Date
): Promise<UserNotificationPreference[]> {
  const startOfDay = new Date(referenceDate);
  startOfDay.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(startOfDay);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const oneDayAgo = new Date(startOfDay);
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  return prisma.userNotificationPreference.findMany({
    where: {
      digestFrequency: frequency,
      emailOptIn: true,
      OR: [
        { lastDigestAt: null },
        frequency === "DAILY"
          ? { lastDigestAt: { lte: oneDayAgo } }
          : { lastDigestAt: { lte: sevenDaysAgo } },
      ],
    },
  });
}

export async function markDigestSent(userId: string, sentAt: Date): Promise<void> {
  await prisma.userNotificationPreference.update({
    where: { userId },
    data: {
      lastDigestAt: sentAt,
    },
  });
}
