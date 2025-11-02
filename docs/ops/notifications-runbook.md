# Notifications & Digest Runbook

**Last Updated:** February 2025

## 1. Overview
- Web push uses VAPID keys and `PushSubscription` records.
- Email digests delivered via Resend (`NotificationDigestFrequency` preferences).
- Feature flag: `NOTIFICATIONS_PUSH_ENABLED` (set to `false` to disable push send).

## 2. Monitoring
- **Push delivery**: Logflare dashboard `notifications-push` (latency & failures).
- **Email digests**: Resend activity feed + cron job logs (`npm run notifications:digest:*`).
- **Error alerts**: Sentry project `sportstrivia-app` tagged with `channel:push` or `channel:digest`.

## 3. Common Issues
| Symptom | Likely Cause | Action |
|--------|--------------|--------|
| Push not received | Browser permission revoked / expired subscription | Ask user to resubscribe; check `/api/notifications/subscriptions` for active rows |
| `410 Gone` errors in logs | Subscription expired | Automatically marked inactive; no action unless widespread |
| Digests not sending | Resend API key missing / job disabled | Verify `RESEND_API_KEY`, run `npm run notifications:digest:daily` manually |
| Duplicate notifications | Multiple sends within 5 min | Validate `tag` usage in push payloads; check `notification.service` overrides |

## 4. Manual Operations
- **Force resend digest**: `npm run notifications:digest:daily` (or `weekly`).
- **Regenerate VAPID keys**: `npm run notifications:vapid` → update env secrets on Vercel.
- **Disable push globally**: set `NOTIFICATIONS_PUSH_ENABLED=false` and redeploy.
- **Clear stale subscriptions**: `DELETE FROM "PushSubscription" WHERE "isActive" = false AND "updatedAt" < now() - interval '30 days';`

## 5. Escalation
- PagerDuty: `#notifications` on-call.
- Stakeholders: product@ and engineering-lead@.
- Provide recent console logs (`vercel logs`) and relevant subscription IDs.

## 6. References
- Implementation plan: `docs/REALTIME_NOTIFICATIONS_PLAN.txt`
- Platform decisions: `docs/NOTIFICATIONS_PUSH.md`
- QA checklist: `docs/qa/notifications-push-checklist.md`
- Scripts: `npm run notifications:*`
