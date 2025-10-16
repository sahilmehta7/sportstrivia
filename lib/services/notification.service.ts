import { prisma } from "@/lib/db";

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
  | "LEADERBOARD_POSITION";

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  data: Record<string, any>
): Promise<void> {
  const messages = {
    FRIEND_REQUEST: "You have a new friend request",
    FRIEND_ACCEPTED: "Your friend request was accepted",
    CHALLENGE_RECEIVED: "You've been challenged to a quiz",
    CHALLENGE_ACCEPTED: "Your challenge was accepted",
    CHALLENGE_COMPLETED: "A challenge has been completed",
    BADGE_EARNED: "You earned a new badge",
    QUIZ_REMINDER: "A new quiz is available",
    LEADERBOARD_POSITION: "You've moved up on the leaderboard",
  };

  await prisma.notification.create({
    data: {
      userId,
      type,
      content: JSON.stringify({
        title: messages[type],
        ...data,
      }),
      read: false,
    },
  });
}

/**
 * Create batch notifications for multiple users
 */
export async function createBatchNotifications(
  userIds: string[],
  type: NotificationType,
  data: Record<string, any>
): Promise<void> {
  const messages = {
    FRIEND_REQUEST: "You have a new friend request",
    FRIEND_ACCEPTED: "Your friend request was accepted",
    CHALLENGE_RECEIVED: "You've been challenged to a quiz",
    CHALLENGE_ACCEPTED: "Your challenge was accepted",
    CHALLENGE_COMPLETED: "A challenge has been completed",
    BADGE_EARNED: "You earned a new badge",
    QUIZ_REMINDER: "A new quiz is available",
    LEADERBOARD_POSITION: "You've moved up on the leaderboard",
  };

  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      content: JSON.stringify({
        title: messages[type],
        ...data,
      }),
      read: false,
    })),
  });
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

