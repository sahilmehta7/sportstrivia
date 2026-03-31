# Google Play Release Assets Brief (v1.0)

Last updated: 2026-03-05
Owner: Product + Design + Growth
Scope: US-English only

## Objective
Produce a submission-ready Google Play listing asset pack using current Sports Trivia UI, automated screenshot capture, and light manual polish.

## Positioning
- Primary value: fast, social sports trivia competition.
- Secondary value: daily progression through streaks, badges, and leaderboards.
- Trust value: user controls include in-app account deletion and data export path.

## Audience
- Sports fans and trivia players looking for short competitive sessions.
- Secondary: friend groups running recurring challenges.

## Conversion Narrative (Screenshot Sequence)
1. Value proposition and breadth of quiz content.
2. Core gameplay moment (question + answers + timer/progress).
3. Social interaction (friends/challenges).
4. Progress loop (leaderboard, streaks, badges).
5. Trust/privacy controls (settings with account deletion availability).

## Deliverables Included in This Pack
- Metadata draft: `docs/release/play-store/metadata.en-US.md`
- Shot plan: `docs/release/play-store/screenshot-shotlist.md`
- Spec checklist: `docs/release/play-store/asset-spec-checklist.md`
- Review checklist: `docs/release/play-store/review-checklist.md`
- Asset directories:
  - `assets/play-store/icon/`
  - `assets/play-store/feature-graphic/`
  - `assets/play-store/screenshots/phone/`
  - `assets/play-store/screenshots/tablet/`

## Capture Environment Standard
- Base URL: staging URL preferred; localhost fallback for iteration.
- Seed account: preloaded profile with attempts, badges, friends/challenges, notifications.
- Device presets:
  - Phone portrait: 1080x1920 (9:16)
  - Phone landscape: 1920x1080 (16:9)
- Browser: Chromium via Playwright.

## Working Rules
- No unsupported claims ("best", "#1", guaranteed outcomes).
- Keep copy policy-safe and evidence-based.
- Use consistent top/bottom safe margins for overlays.
- Avoid tiny UI text in screenshots; prioritize large focal elements.

## Handoff Package Definition
A release asset pack is considered complete when:
1. All required files pass `node scripts/play-store/validate-assets.mjs`.
2. Metadata text passes character limits and QA gates.
3. Screenshot sequence is mapped to conversion narrative.
4. Product, Design, and QA sign off in `review-checklist.md`.

## Update Cadence
- Minor refresh: every feature release touching player UX.
- Major refresh: quarterly full pack revision.
