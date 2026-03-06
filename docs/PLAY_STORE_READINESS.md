# Google Play Store Readiness

**Last Updated**: 2026-03-05  
**Overall Readiness**: **In progress**  
**Current Milestone**: Policy-critical in-app account deletion is implemented; packaging and submission tracks remain.

---

## 1) Readiness Snapshot

### Completed
- ✅ In-app account deletion available in Profile -> Settings -> Danger Zone.
- ✅ Destructive confirmation gate (`DELETE`) implemented.
- ✅ Successful deletion signs user out and redirects.
- ✅ Deletion funnel analytics implemented:
  - `account_delete_viewed`
  - `account_delete_export_clicked`
  - `account_delete_confirmed`
  - `account_delete_succeeded`
  - `account_delete_failed`
- ✅ Optional export path available via `/api/users/me/export`.
- ✅ PWA manifest and validation tooling exist (`app/manifest.ts`, `npm run pwa:validate`).
- ✅ Release asset workspace created:
  - `docs/release/play-store/*`
  - `assets/play-store/*`
  - `scripts/play-store/*`
- ✅ Baseline US-English metadata drafted (`docs/release/play-store/metadata.en-US.md`).
- ✅ Baseline feature graphic + screenshot bundle generated and validated.

### Still Required Before Submission
- 🚧 Confirm final Android app strategy (TWA wrapper vs native shell).
- 🚧 Produce signed release artifact (AAB) and internal test track release.
- 🚧 Complete Play Console setup and policy declarations.
- 🚧 Finalize store listing assets, legal links, and support metadata.
- 🚧 Run device-level QA and pre-launch checks.

---

## 2) Remaining Task List (All Other Tasks Required)

## A. Product/Policy Compliance
- [ ] Ensure account deletion is enabled for production/review builds (`NEXT_PUBLIC_ACCOUNT_DELETION_ENABLED=true` in review environment).
- [ ] Update privacy policy text to explicitly reference in-app deletion path and export behavior.
- [ ] Publish support/help article with exact deletion steps and expected outcomes.
- [ ] Document v1 caveat: storage object cleanup for `Media.fileUrl` is deferred to v1.1.
- [ ] Complete manual verification:
  - [ ] Deleted users cannot re-access authenticated routes.
  - [ ] Deleted users cannot authenticate with prior provider session.
  - [ ] Cascade deletion invariants validated in DB.
- [ ] Prepare policy response text for Play review questions (data deletion, retention, support SLA).

## B. Android Packaging & Release Engineering
- [ ] Choose distribution architecture:
  - [ ] Trusted Web Activity (recommended for current Next.js/PWA baseline), or
  - [ ] Native container app (React Native/Flutter) if native requirements are added.
- [ ] Create Android project/release pipeline for chosen architecture.
- [ ] Configure package name, app signing, versioning, and release channels.
- [ ] Generate signed `.aab` for internal testing.
- [ ] Verify digital asset links and domain association if using TWA.
- [ ] Validate install/launch/update flows on Android 10-15 devices.

## C. Play Console Setup
- [ ] Create/verify Play Console app record and organization permissions.
- [ ] Configure internal testing track and tester groups.
- [ ] Complete Data safety form (data collected/shared, purpose, retention, deletion behavior).
- [ ] Complete App access declaration (test credentials/instructions if required).
- [ ] Complete content rating questionnaire.
- [ ] Complete ads declaration and target audience declarations.
- [ ] Add privacy policy URL and support contact details.

## D. Store Listing Assets
- [x] App title, short description, full description. (draft ready)
- [x] Feature graphic and app icon (Play-safe dimensions). (baseline ready)
- [x] Phone screenshots (minimum required count and correct aspect ratios). (baseline ready)
- [ ] Optional tablet/large-screen screenshots.
- [ ] Localization pass for target launch locales.

## E. Security, Reliability, and Performance
- [ ] Run production lint and full automated test suite on release candidate.
- [ ] Execute mobile-focused regression checklist:
  - [ ] Auth sign-in/out
  - [ ] Quiz play end-to-end
  - [ ] Friends/challenges
  - [ ] Notifications
  - [ ] Account deletion and export
- [ ] Run Lighthouse/PWA quality checks on release domain.
- [ ] Validate API rate limiting and error monitoring thresholds.
- [ ] Confirm crash/error telemetry is active for release builds.

## F. Operations and Launch Readiness
- [ ] Define rollout plan (internal -> closed testing -> staged production -> 100%).
- [ ] Define monitoring dashboard for first 48-72 hours:
  - [ ] Install/startup success
  - [ ] Auth success rate
  - [ ] Quiz completion rate
  - [ ] Account deletion success/error rate
  - [ ] Support ticket volume
- [ ] Create rollback criteria and on-call runbook.
- [ ] Prepare release notes and known-issues section.

---

## 3) Suggested Execution Order

1. Finalize policy/legal wording + deletion verification evidence.  
2. Lock Android packaging approach and produce first internal AAB.  
3. Complete Play Console declarations and store listing assets.  
4. Run full QA on internal track build and fix blockers.  
5. Launch staged rollout with monitoring and rollback guardrails.
