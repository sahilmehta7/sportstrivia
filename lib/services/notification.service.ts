import { prisma } from "@/lib/db";
import { queuePushNotification, type PushMessagePayload } from "@/lib/services/push-delivery.service";

/**
 * Notification types
 */
export type NotificationType =
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "CHALLENGE_RECEIVED"
  | "CHALLENGE_ACCEPTED"
  | "CHALLENGE_COMPLETED"
  | "BADGE_EARNED"
  | "QUIZ_REMINDER"
  | "LEADERBOARD_POSITION"
  | "LEVEL_UP"
  | "TIER_UPGRADED"
  | "STREAK_UPDATED";

const notificationMessages: Record<NotificationType, string> = {
  FRIEND_REQUEST: "You have a new friend request",
  FRIEND_ACCEPTED: "Your friend request was accepted",
  CHALLENGE_RECEIVED: "You've been challenged to a quiz",
  CHALLENGE_ACCEPTED: "Your challenge was accepted",
  CHALLENGE_COMPLETED: "A challenge has been completed",
  BADGE_EARNED: "You earned a new badge",
  QUIZ_REMINDER: "A new quiz is available",
  LEADERBOARD_POSITION: "You've moved up on the leaderboard",
  LEVEL_UP: "You've leveled up!",
  TIER_UPGRADED: "You've reached a new tier!",
  STREAK_UPDATED: "Your streak is alive!",
};

type NotificationDeliveryOptions = {
  push?:
  | false
  | (Partial<PushMessagePayload> & {
    url?: string;
    tag?: string;
  });
};

async function isPushOptIn(userId: string): Promise<boolean> {
  const preference = await prisma.userNotificationPreference.findUnique({
    where: { userId },
    select: { pushOptIn: true },
  });
  return preference?.pushOptIn !== false;
}

async function sendPushIfEligible(
  userId: string,
  payload: PushMessagePayload & { url?: string; tag?: string }
): Promise<void> {
  const shouldSend = await isPushOptIn(userId);
  if (!shouldSend) return;

  await queuePushNotification(userId, {
    title: payload.title,
    body: payload.body,
    icon: payload.icon,
    badge: payload.badge,
    tag: payload.tag,
    url: payload.url,
    data: payload.data,
  });
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  data: Record<string, any>,
  options?: NotificationDeliveryOptions
): Promise<void> {
  const defaultTitle = notificationMessages[type] ?? "Sports Trivia";

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      content: JSON.stringify({
        title: defaultTitle,
        ...data,
      }),
      read: false,
    },
  });

  if (options?.push === false) {
    return;
  }

  const pushOverrides = typeof options?.push === "object" ? options.push : undefined;

  await sendPushIfEligible(userId, {
    title: pushOverrides?.title ?? defaultTitle,
    body: pushOverrides?.body ?? data.body ?? data.message,
    icon: pushOverrides?.icon,
    badge: pushOverrides?.badge,
    tag: pushOverrides?.tag ?? `${type}:${notification.id}`,
    url: pushOverrides?.url ?? data.url,
    data: {
      notificationId: notification.id,
      type,
      ...(pushOverrides?.data ?? {}),
    },
  });
}

/**
 * Create batch notifications for multiple users
 */
export async function createBatchNotifications(
  userIds: string[],
  type: NotificationType,
  data: Record<string, any>,
  options?: NotificationDeliveryOptions
): Promise<void> {
  const defaultTitle = notificationMessages[type] ?? "Sports Trivia";

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      content: JSON.stringify({
        title: defaultTitle,
        ...data,
      }),
      read: false,
    })),
  });

  if (options?.push === false) {
    return;
  }

  await Promise.all(
    userIds.map((userId) =>
      sendPushIfEligible(userId, {
        title: typeof options?.push === "object" && options.push.title ? options.push.title : defaultTitle,
        body:
          (typeof options?.push === "object" && options.push.body) ??
          data.body ??
          data.message,
        icon: typeof options?.push === "object" ? options.push.icon : undefined,
        badge: typeof options?.push === "object" ? options.push.badge : undefined,
        tag:
          (typeof options?.push === "object" ? options.push.tag : undefined) ??
          `${type}:${Date.now()}`,
        url: typeof options?.push === "object" ? options.push.url : data.url,
        data: {
          type,
          ...(typeof options?.push === "object" ? options.push.data : {}),
        },
      })
    )
  );
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      read: true,
    },
  });
}

/**
 * Mark all user notifications as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  });

  return result.count;
}

/**
 * Delete old read notifications (cleanup)
 */
export async function deleteOldNotifications(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.notification.deleteMany({
    where: {
      read: true,
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

/**
 * Create level up notification with spam guard
 * Only creates notification if user actually reached a new level and no notification was sent recently
 */
export async function notifyLevelUp(
  userId: string,
  level: number,
  options?: { skipRecentCheck?: boolean }
): Promise<boolean> {
  if (!options?.skipRecentCheck) {
    // Check if we already sent a notification for this level in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await prisma.notification.findMany({
      where: {
        userId,
        type: "LEVEL_UP",
        createdAt: { gte: oneHourAgo },
      },
      take: 10, // Check last 10 notifications
    });
    // Parse content to check if any match this level
    for (const notif of recent) {
      try {
        const content = JSON.parse(notif.content);
        if (content.level === level) {
          return false; // Already notified for this level
        }
      } catch {
        // If parsing fails, check string contains as fallback
        if (notif.content.includes(`"level":${level}`)) {
          return false;
        }
      }
    }
  }

  await createNotification(
    userId,
    "LEVEL_UP",
    {
      level,
      message: `Congratulations! You've reached level ${level}`,
    },
    {
      push: {
        title: "Level up!",
        body: `You reached level ${level}. Keep the momentum going.`,
        url: "/profile/me",
        tag: `level:${level}`,
        data: { level },
      },
    }
  );
  return true;
}

/**
 * Create tier upgrade notification with spam guard
 * Only creates notification if user actually reached a new tier and no notification was sent recently
 */
export async function notifyTierUpgrade(
  userId: string,
  tierId: number,
  tierName: string,
  options?: { skipRecentCheck?: boolean }
): Promise<boolean> {
  if (!options?.skipRecentCheck) {
    // Check if we already sent a notification for this tier in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recent = await prisma.notification.findMany({
      where: {
        userId,
        type: "TIER_UPGRADED",
        createdAt: { gte: oneHourAgo },
      },
      take: 10, // Check last 10 notifications
    });
    // Parse content to check if any match this tier
    for (const notif of recent) {
      try {
        const content = JSON.parse(notif.content);
        if (content.tierId === tierId) {
          return false; // Already notified for this tier
        }
      } catch {
        // If parsing fails, check string contains as fallback
        if (notif.content.includes(`"tierId":${tierId}`)) {
          return false;
        }
      }
    }
  }

  await createNotification(
    userId,
    "TIER_UPGRADED",
    {
      tierId,
      tierName,
      message: `Amazing! You've reached the ${tierName} tier!`,
    },
    {
      push: {
        title: "Tier unlocked",
        body: `Welcome to the ${tierName} tier. Explore your new rewards.`,
        url: "/profile/me",
        tag: `tier:${tierId}`,
        data: { tierId, tierName },
      },
    }
  );
  return true;
}
