import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import {
  deletePushSubscriptionSchema,
  pushSubscriptionSchema,
} from "@/lib/dto/push-subscription.dto";
import {
  removePushSubscription,
  upsertPushSubscription,
} from "@/lib/services/push-subscription.service";
import { handleError, successResponse } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const payload = pushSubscriptionSchema.parse(body);

    const userAgent = request.headers.get("user-agent");
    const deviceType = payload.deviceType ?? request.headers.get("x-device-type") ?? undefined;

    const subscription = await upsertPushSubscription(
      user.id,
      payload,
      {
        userAgent,
        deviceType,
      }
    );

    return successResponse({
      subscriptionId: subscription.id,
      endpoint: subscription.endpoint,
    }, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const payload = deletePushSubscriptionSchema.parse(body);

    const removed = await removePushSubscription(user.id, payload.endpoint);

    return successResponse({
      removed,
    });
  } catch (error) {
    return handleError(error);
  }
}
