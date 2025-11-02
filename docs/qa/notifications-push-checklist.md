# Notifications & Push QA Checklist

**Last Updated:** February 2025  
**Scope:** Web push subscriptions, notification preferences, email digests

## Pre-requisites
- `.env.local` contains push and email variables (`NEXT_PUBLIC_PUSH_PUBLIC_KEY`, `PUSH_PUBLIC_KEY`, `PUSH_PRIVATE_KEY`, `RESEND_API_KEY`, etc.)
- Run `npm run notifications:vapid` if new keys required.
- Use Chromium-based browser for initial verification (Firefox/Safari follow-up).

## Push Subscription Flow
1. Visit `/notifications` and ensure “Push notifications” card renders without errors.
2. Click **Enable push** → browser permission prompt appears and resolves.
3. Inspect `/api/notifications/subscriptions` in network panel (expect 201 and subscription id).
4. Reload page → status shows “Subscribed”.
5. Click **Disable push** → check DELETE request and subscription removed.
6. Verify `/api/notifications/preferences` reflects `pushOptIn = false` after unsubscribe.

## Browser Coverage
- Chrome desktop/macOS (latest)
- Firefox desktop
- Safari desktop
- Chrome on Android (real device or emulator)
- iOS Safari (ensure fallback messaging for unsupported push)

## Challenge Notifications
1. With two users (A challenger, B challenged), enable push for both.
2. User A sends challenge to B → B receives push with CTA link to `/challenges/[id]`.
3. User B accepts challenge → User A receives push.
4. Confirm in-app notifications created (`/api/notifications` returns new entries).

## Streak Notifications
1. For test user, manually adjust `User.currentStreak` to simulate previous day.
2. Complete quiz attempt via `/api/attempts/[id]/complete`.
3. Observe push describing streak status; notification record created with type `STREAK_UPDATED`.

## Notification Preferences
1. In `/notifications` → “Email digests” card:
   - Change cadence to Weekly; disable email toggle; Save.
   - Refresh status → saved values persist.
2. Confirm API returns updated preferences.

## Email Digest Job
1. Seed sample notifications within last day for test user.
2. Run `npm run notifications:digest:daily`.
3. Check console for `[digest] Completed DAILY digest run`.
4. Verify Resend activity (if using sandbox) or intercept email via test inbox.
5. Inspect database: `UserNotificationPreference.lastDigestAt` updated.

## Regression Sweep
- `/notifications` page still fetches list and pagination works.
- Profile settings tab renders with new cards and existing edit profile workflow unaffected.
- Service worker (`sw-push.js`) available at root; no 404s.

Log findings in the release ticket and update this checklist if flows change.
