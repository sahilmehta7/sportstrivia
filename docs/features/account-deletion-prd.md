# PRD: Self-Serve Account Deletion (User-Initiated)

**Author**: Sahil + Codex  
**Date**: 2026-03-05  
**Status**: Implemented v1 (Hard Delete) — 2026-03-05

---

## 1. Executive Summary

### Problem Statement
Users can currently delete their account via backend API (`DELETE /api/users/me`), but there is no clear in-app self-serve UI flow from profile settings. This creates compliance, trust, and support risk, especially for app-store distribution expectations around account deletion discoverability.

### Proposed Solution
Ship a clear, secure “Delete Account” flow in Profile Settings (Danger Zone), with explicit confirmation, optional data export reminder, and reliable backend execution. Keep MVP aligned with existing API and schema cascades, then iterate with optional soft-delete grace period if needed.

### Business Impact (Expected)
- Reduce support burden for manual account deletion requests.
- Improve user trust and transparency for privacy controls.
- Improve readiness for platform policy checks (Google Play/User Data expectations).

### Timeline (High-Level)
- MVP (v1): 1 sprint (3-5 engineering days + QA).
- v1.1 hardening: +1 sprint for soft-delete/undo window if required.

### Resources Required
- 1 full-stack engineer, 1 designer (part-time), 1 QA pass.

### Success Metrics (Targets / Guardrails)
- Deletion flow completion rate (start -> success) >= 85%.
- Deletion API success rate >= 99.5% (non-user-error).
- Support tickets tagged “delete account request” reduced by >= 80% after release.

---

## 2. Problem Definition

### 2.1 Customer Problem
- **Who**: Registered Sports Trivia users who want to stop using the product and remove data.
- **What**: They cannot currently find/use an in-app deletion flow, despite backend capability.
- **When**: During privacy-sensitive moments (switching services, trust concerns, clean-up).
- **Why**: UI gap in settings; deletion exists as API only.
- **Impact**: Friction, compliance risk perception, and manual support escalations.

### 2.2 Opportunity
Account deletion is a foundational trust feature. A robust in-app flow strengthens privacy posture and materially improves launch readiness for mobile store submissions.

### 2.3 Business Case
- **Strategic value**: Privacy-by-design baseline for growth and app distribution.
- **Operational value**: Fewer ad-hoc deletions handled by admins/support.
- **Risk reduction**: Clear, auditable, testable deletion behavior.

---

## 3. Solution Overview

### 3.1 Proposed Solution
Add a first-class account deletion journey under Profile -> Settings:
1. User opens **Danger Zone** section.
2. User selects **Delete Account**.
3. User passes explicit confirmation step (high-friction confirmation text + irreversible warning).
4. Optional nudge to export data (existing `GET /api/users/me/export`).
5. System calls `DELETE /api/users/me`.
6. On success, session is terminated and user is redirected to signed-out landing/auth screen.

### 3.2 In Scope (v1 MVP)
- Settings UI entry point and destructive confirmation modal/page.
- Frontend integration with existing `DELETE /api/users/me`.
- UX copy and safeguards against accidental deletion.
- Post-delete UX (toast + redirect/sign-out).
- Analytics events for funnel and failure states.
- QA test coverage (unit/integration + manual checklist).

### 3.3 Out of Scope (v1)
- Soft-delete grace period / undo restore.
- Admin recovery tooling.
- Legal workflow automation (DSAR ticketing integrations).
- Email-confirmation deletion workflow.

### 3.4 MVP Definition
- A logged-in user can discover, confirm, and complete account deletion without support intervention.
- Deletion removes user-linked records via existing schema cascade behavior.
- User can no longer authenticate with deleted account.

---

## 4. User Stories & Requirements

### US-001 — Discover deletion option (P0)
As a user, I want to find account deletion in settings so that I can control my account lifecycle.

Acceptance Criteria:
- [ ] “Danger Zone” is visible in Profile Settings.
- [ ] “Delete Account” CTA is clearly destructive and separated from normal settings.

### US-002 — Confirm irreversible action (P0)
As a user, I want a clear confirmation flow so that I understand consequences before deleting.

Acceptance Criteria:
- [ ] Confirmation UI states action is irreversible.
- [ ] User must complete a deliberate confirm action (e.g., typed confirmation).
- [ ] Primary destructive action remains disabled until confirmation requirement is met.

### US-003 — Execute deletion and sign out (P0)
As a user, when I confirm deletion, my account and associated data should be removed and I should be signed out.

Acceptance Criteria:
- [ ] Frontend calls `DELETE /api/users/me`.
- [ ] On success, user is signed out and redirected.
- [ ] Deleted account can no longer access authenticated routes.

### US-004 — Export data awareness (P1)
As a user, I want to be reminded to export my data before deletion.

Acceptance Criteria:
- [ ] Confirmation flow includes “Download my data first” action linked to `/api/users/me/export`.
- [ ] Export is optional and does not block deletion.

---

## 5. Functional Requirements

| ID | Requirement | Priority | Notes |
|---:|-------------|:--------:|------|
| FR1 | Add “Danger Zone” in profile settings UI | P0 | In `app/profile/me` flow |
| FR2 | Add destructive confirmation modal/page | P0 | Requires deliberate user confirmation |
| FR3 | Call `DELETE /api/users/me` and handle all states | P0 | success, auth error, transient failure |
| FR4 | Terminate session and redirect after success | P0 | Avoid zombie authenticated UI |
| FR5 | Surface optional data export link before delete | P1 | Uses existing export endpoint |
| FR6 | Add deletion analytics events | P1 | start, confirm, success, failure |
| FR7 | Ensure idempotent UX on repeated submit | P1 | Disable button/spinner; prevent double-fire |

---

## 6. Non-Functional Requirements

- **Security**:
  - Deletion endpoint remains authenticated (`requireAuth`).
  - Prevent CSRF/regression in destructive action path.
  - Avoid exposing user identifiers in client-visible errors.
- **Reliability**:
  - If deletion fails, no partial-success messaging.
  - Return actionable but safe error states to UI.
- **Performance**:
  - Deletion request p95 < 2s under normal load.
- **Compliance posture**:
  - Do not claim legal certification; ensure practical privacy control is implemented and documented.
- **Accessibility**:
  - Modal fully keyboard navigable and screen-reader compatible.

---

## 7. UX / Content Requirements

### 7.1 Placement
- Add section in Profile Settings tab (`app/profile/me/ProfileMeClient.tsx`) below profile config and notification controls.

### 7.2 Interaction pattern
- CTA label: `Delete Account`
- Warning copy:
  - “This action permanently deletes your account and cannot be undone.”
  - “Your profile, attempts, reviews, friends/challenges, notifications, badges, and related data will be removed.”
- Confirmation input:
  - Require user to type `DELETE` (exact match) before destructive CTA enabled.

### 7.3 Empty/error states
- Network error: “Could not delete account. Please try again.”
- Auth/session expired: route to sign-in with explanation.
- While pending: disable all destructive controls and show spinner text.

---

## 8. Technical Specifications

### 8.1 Existing backend capability
- `DELETE /api/users/me` already exists in [app/api/users/me/route.ts](/Users/sahilmehta/sportstrivia-2/app/api/users/me/route.ts:73).
- Endpoint uses `requireAuth`, `assertRestoreUnlocked`, and deletes `User` in transaction.

### 8.2 Existing export capability
- `GET /api/users/me/export` exists in [app/api/users/me/export/route.ts](/Users/sahilmehta/sportstrivia-2/app/api/users/me/export/route.ts:12).
- Reuse as pre-deletion optional action.

### 8.3 Data deletion matrix (schema-backed)
Most user-linked data is configured with `onDelete: Cascade` in Prisma and should be deleted automatically when `User` is deleted, including:
- Auth/session: `Account`, `Session`
- Gameplay/social: `QuizAttempt`, `UserAnswer` (via attempt), `QuizLeaderboard`, `Friend`, `Challenge`, `DailyGameAttempt`, `GridAttempt`, `GridAnswer` (via attempt)
- User profile artifacts: `UserBadge`, `Notification`, `QuizReview`, `QuestionReport`, `UserTopicStats`, `UserSearchQuery`, `UserLevel`, `UserTierHistory`
- Notification settings: `PushSubscription`, `UserNotificationPreference`
- Media rows: `Media` (DB row cascades)
- `AdminBackgroundTask.userId` is `onDelete: SetNull` (retained task history without user FK)

### 8.4 Known caveat
- Storage objects referenced by `Media.fileUrl` may become orphaned if physical file deletion is not executed. v1 should explicitly document behavior; v1.1 may add storage cleanup worker.

### 8.5 API behavior recommendations (v1 hardening)
- Keep current sync delete response contract:
  - success: `{ success: true, message: "Your account has been permanently deleted" }`
  - errors: standardized error shape from `handleError`.
- Ensure UI treats delete action as one-shot and non-retry-spam.

---

## 9. Analytics & Observability

Track events:
- `account_delete_viewed`
- `account_delete_export_clicked`
- `account_delete_confirmed`
- `account_delete_succeeded`
- `account_delete_failed` (include error class/category, not raw PII)

Operational logs:
- Count delete attempts/day
- Success/failure ratio
- p95 latency

---

## 10. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------:|-------:|-----------|
| Accidental deletion | Medium | High | Typed confirmation + destructive styling + explicit warnings |
| Partial deletion assumptions | Low | High | Use schema cascade model + integration tests validating post-delete invariants |
| Orphaned storage files | Medium | Medium | Document in v1; add async cleanup in v1.1 |
| Regression in auth/session state | Medium | Medium | Post-delete forced sign-out + route guard tests |

---

## 11. Rollout Plan

### Phase 0 (internal)
- Enable behind feature flag (recommended): `NEXT_PUBLIC_ACCOUNT_DELETION_ENABLED`.
- QA in staging with seeded users and relational data.

### Phase 1 (limited release)
- Enable for internal/admin cohort first.
- Monitor deletion success and auth/logout behavior.

### Phase 2 (general availability)
- Enable for all users.
- Publish short privacy/help update referencing in-app path.

---

## 12. QA / Verification Checklist

- [x] Deletion option discoverable in profile settings.
- [x] Confirmation gate blocks accidental click-through.
- [x] Successful deletion signs out and prevents re-entry.
- [x] Export endpoint remains functional pre-delete.
- [ ] Deleted user cannot authenticate again via previous provider session. (manual staging verification pending)
- [ ] Core cascaded relations absent after delete (attempts, friends, challenges, notifications, badges, preferences). (manual DB verification pending)
- [ ] `AdminBackgroundTask.userId` set to `null` where applicable (not deleted). (manual DB verification pending)

---

## 13. Open Questions

1. Should v1 require fresh re-auth (recent login) before delete, or is active session sufficient?
2. Do we want v1 hard-delete only, or should we move directly to soft-delete + 7/14-day undo window?
3. Should deletion trigger a confirmation email receipt?
4. Should media storage physical cleanup be included in v1 scope?

---

## 14. Appendix

### Relevant Existing Files
- Deletion API: [app/api/users/me/route.ts](/Users/sahilmehta/sportstrivia-2/app/api/users/me/route.ts:73)
- Data export API: [app/api/users/me/export/route.ts](/Users/sahilmehta/sportstrivia-2/app/api/users/me/export/route.ts:12)
- Profile settings UI (insertion point): [app/profile/me/ProfileMeClient.tsx](/Users/sahilmehta/sportstrivia-2/app/profile/me/ProfileMeClient.tsx:334)
- Privacy policy page: [app/privacy/page.tsx](/Users/sahilmehta/sportstrivia-2/app/privacy/page.tsx:1)
- Terms page: [app/terms/page.tsx](/Users/sahilmehta/sportstrivia-2/app/terms/page.tsx:1)
- Data model: [prisma/schema.prisma](/Users/sahilmehta/sportstrivia-2/prisma/schema.prisma:58)

---

## 15. Operator Note (v1 Scope)

- v1 intentionally performs DB-level hard delete only.
- Physical media object cleanup for `Media.fileUrl` storage keys is deferred to v1.1.
- If storage cleanup is required, run it as an asynchronous follow-up process so account deletion remains fast and reliable.
