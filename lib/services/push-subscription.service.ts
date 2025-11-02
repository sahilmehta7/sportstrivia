import type { PushSubscription } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { PushSubscriptionPayload } from "@/lib/dto/push-subscription.dto";

export async function upsertPushSubscription(
  userId: string,
  payload: PushSubscriptionPayload,
  metadata: { userAgent?: string | null; deviceType?: string | null } = {}
): Promise<PushSubscription> {
  const now = new Date();

  return prisma.pushSubscription.upsert({
    where: {
      endpoint: payload.endpoint,
    },
    update: {
      userId,
      keysP256dh: payload.keys.p256dh,
      keysAuth: payload.keys.auth,
      expirationTime:
        typeof payload.expirationTime === "number"
          ? new Date(payload.expirationTime)
          : null,
      userAgent: metadata.userAgent ?? null,
      deviceType: payload.deviceType ?? metadata.deviceType ?? null,
      isActive: true,
      lastUsedAt: now,
    },
    create: {
      userId,
      endpoint: payload.endpoint,
      keysP256dh: payload.keys.p256dh,
      keysAuth: payload.keys.auth,
      expirationTime:
        typeof payload.expirationTime === "number"
          ? new Date(payload.expirationTime)
          : null,
      userAgent: metadata.userAgent ?? null,
      deviceType: payload.deviceType ?? metadata.deviceType ?? null,
      lastUsedAt: now,
    },
  });
}

export async function removePushSubscription(
  userId: string,
  endpoint: string
): Promise<boolean> {
  const result = await prisma.pushSubscription.deleteMany({
    where: {
      endpoint,
      userId,
    },
  });

  return result.count > 0;
}

export async function listActivePushSubscriptions(
  userId: string
): Promise<PushSubscription[]> {
  return prisma.pushSubscription.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function markPushSubscriptionInactive(
  endpoint: string
): Promise<void> {
  await prisma.pushSubscription.updateMany({
    where: { endpoint },
    data: { isActive: false },
  });
}
