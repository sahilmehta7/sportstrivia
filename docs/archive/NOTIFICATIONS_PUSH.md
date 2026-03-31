# Notifications Platform Decisions

**Last Updated:** February 2025  
**Owner:** Notifications workstream

## 1. Delivery Channels

- **Web Push:** Use native Web Push API with self-hosted VAPID keys. This keeps control in-house, avoids vendor lock-in, and works with our Next.js edge/runtime model. Third-party SDKs (OneSignal, Firebase) are optional future considerations but are not required for initial launch.
- **Email Digests:** Use **Resend** as the transactional email provider. Rationale:
  - Simple REST API, TypeScript SDK, and reliable deliverability.
  - Existing developer familiarity; no additional DNS setup beyond SPF/DKIM already configured for marketing email.
  - Supports templating (React/JSX) aligning with our codebase.

> Contingency: If Resend is unavailable, Postmark is the backup provider (minimal code changes thanks to adapter pattern in Task 6).

## 2. Key Secrets & Environment Variables

| Variable | Description | Scope |
|----------|-------------|-------|
| `NEXT_PUBLIC_PUSH_PUBLIC_KEY` | VAPID public key exposed to the browser | Web push |
| `PUSH_PUBLIC_KEY` | VAPID public key shared with clients | Web push |
| `PUSH_PRIVATE_KEY` | VAPID private key used server-side | Web push |
| `PUSH_SUBJECT` | Contact email/URL, e.g., `mailto:support@sportstrivia.in` | Web push |
| `RESEND_API_KEY` | API key for Resend | Email digests |
| `NOTIFICATION_DIGEST_FROM` | Sender email address (e.g., `notifications@sportstrivia.in`) | Email digests |
| `NOTIFICATION_DIGEST_REPLY_TO` | Reply-to address (optional) | Email digests |

Add these to `.env.example`, `.env.local`, and deployment secrets before implementation tasks begin.

## 3. Consent & Compliance

- **Opt-In Requirements:** Push notifications require explicit user consent via browser prompt. The UI must clarify benefits and include instructions for revoking permissions.
- **Opt-Out:** Users can unsubscribe from push via profile/notifications settings; email digests must include unsubscribe link pointing back to the same settings.
- **Regulatory Notes:** Align with GDPR/CAN-SPAM by:
  - Logging timestamp + channel when consent granted/revoked (stored alongside subscription/preferences).
  - Avoiding push for sensitive content; stick to gameplay events (challenges, streaks, badges).
  - Honoring deletion requests by removing subscriptions and preferences.

## 4. Implementation Overview

1. Capture subscriptions via `POST /api/notifications/subscriptions` (protected by `requireAuth`).
2. Store subscriptions in new Prisma model (`PushSubscription`) keyed by user + endpoint.
3. Register service worker (`/sw-push.js`) to show notifications using payload `title`, `body`, `url`, and optional `tag`.
4. Trigger push/email events from notification service adapters (Task 6) with deduplication (do not repeat send inside 5 minutes).
5. Digest job aggregates pending items per user based on preference (`OFF`, `DAILY`, `WEEKLY`).

## 5. Implementation Snapshot (Feb 2025)

- **API endpoints**
  - `POST /api/notifications/subscriptions` – register browser subscription
  - `DELETE /api/notifications/subscriptions` – unsubscribe
  - `GET /api/notifications/preferences` – fetch digest/push prefs
  - `PUT /api/notifications/preferences` – update prefs
- **Prisma schema**: `PushSubscription`, `UserNotificationPreference`, `NotificationDigestFrequency`
- **Client components**: `PushSubscriptionCard`, `DigestPreferencesCard` (used on `/notifications` + profile settings)
- **Service worker**: `public/sw-push.js`
- **Server helpers**: `push-subscription.service`, `push-delivery.service`, `notification.service` (channel adapters)
- **Schedulers**: `scripts/sendNotificationDigests.ts` (`npm run notifications:digest:*`)
- **Tests**: `__tests__/api/notifications.subscriptions.test.ts`, `__tests__/api/notifications.preferences.test.ts`, `__tests__/lib/digest.job.test.ts`

## 6. Developer Tips

- Run `npm run notifications:vapid` to generate keys locally.
- Add `NEXT_PUBLIC_PUSH_PUBLIC_KEY` to expose VAPID public key to client components.
- Service worker is auto-registered by `PushSubscriptionCard`; no extra setup for SSR routes.
- For staging verification, use Chrome devtools > Application > Push to manually trigger payloads.
- Digest job can be smoke-tested locally with `npm run notifications:digest:daily`; inspect console and Resend sandbox.

## 7. Pending Questions / Follow-Ups

- Finalize exact digest cadence defaults (proposed: default `OFF`, prompt user after 3 successful logins).
- Determine feature flag strategy for rollout (`NOTIFICATIONS_PUSH_ENABLED`).
- Confirm background worker deployment (likely Vercel cron or external worker).

Document updates will track as tasks complete. Refer to `docs/REALTIME_NOTIFICATIONS_PLAN.txt` for execution order.
