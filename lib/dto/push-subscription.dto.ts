import { z } from "zod";

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  deviceType: z.string().optional(),
});

export type PushSubscriptionPayload = z.infer<typeof pushSubscriptionSchema>;

export const deletePushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
});
