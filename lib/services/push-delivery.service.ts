import webpush from "web-push";
import type { PushSubscription } from "@prisma/client";
import { getNotificationFeatureFlag, getPushConfig, isPushConfigured } from "@/lib/config/notifications";
import {
  listActivePushSubscriptions,
  markPushSubscriptionInactive,
} from "@/lib/services/push-subscription.service";

export type PushMessagePayload = {
  title: string;
  body?: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
};

let vapidInitialized = false;

function ensureVapidConfigured() {
  if (vapidInitialized) return;
  if (!isPushConfigured()) return;

  const { publicKey, privateKey, subject } = getPushConfig();
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidInitialized = true;
  } catch (error) {
    console.error("[push] Failed to set VAPID details", error);
  }
}

async function sendPushToSubscription(
  subscription: PushSubscription,
  payload: PushMessagePayload
): Promise<void> {
  ensureVapidConfigured();
  if (!isPushConfigured()) {
    console.warn("[push] Attempted to send push without configuration");
    return;
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keysP256dh,
          auth: subscription.keysAuth,
        },
      },
      JSON.stringify(payload)
    );
  } catch (error: any) {
    if (error?.statusCode === 404 || error?.statusCode === 410) {
      console.warn("[push] Subscription gone, marking inactive", subscription.endpoint);
      await markPushSubscriptionInactive(subscription.endpoint);
      return;
    }
    console.error("[push] Failed to send notification", error);
  }
}

export async function queuePushNotification(
  userId: string,
  payload: PushMessagePayload
): Promise<void> {
  if (!getNotificationFeatureFlag()) {
    return;
  }

  const subscriptions = await listActivePushSubscriptions(userId);
  if (subscriptions.length === 0) {
    return;
  }

  await Promise.allSettled(
    subscriptions.map((subscription) => sendPushToSubscription(subscription, payload))
  );
}
