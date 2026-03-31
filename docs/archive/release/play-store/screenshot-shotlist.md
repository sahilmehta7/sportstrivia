# Screenshot Shotlist (Google Play, v1)

Last updated: 2026-03-06
Scope: Phone-first (US-English)

## Capture Standards
- Primary output: PNG
- Phone portrait target: 1080x1920 (9:16)
- Deterministic seed data required for social/progression screens
- Runtime for final pass: `next build && next start` (production)
- UI language: English (US)

## Source of Truth
- Shot manifest: `docs/release/play-store/screenshot-manifest.v1.json`
- Overlay spec: `docs/release/play-store/screenshot-overlays.en-US.json`
- Capture report: `docs/release/play-store/screenshot-capture-report.json`

## Commands
- Raw capture only (uses manifest):
  - `PLAY_BASE_URL=http://localhost:3001 PLAY_AUTH_USER_EMAIL="play-capture@example.com" npm run play:assets:capture`
- Overlay pass:
  - `npm run play:assets:overlays`
- Screenshot QA:
  - `npm run play:assets:qa`
- Full production pipeline (build/start/capture/overlay/qa/validate):
  - `PLAY_AUTH_USER_EMAIL="play-capture@example.com" npm run play:assets:capture:prod`

## Final Shot Sequence

### SHOT-01: Value Prop / Discovery
- File: `01-discover-quizzes.png`
- Route: `/quizzes`
- Must show: value prop + quiz CTA card in same frame

### SHOT-02: Core Gameplay Moment
- File: `02-gameplay-question.png`
- Route flow: `/random-quiz` -> `INITIALIZE MISSION` -> live play
- Must show: question prompt + answer choices

### SHOT-03: Results and Feedback
- File: `03-results-summary.png`
- Route: seeded results route (`/quizzes/{slug}/results/{attemptId}`)
- Must show: result summary and mission outcome

### SHOT-04: Social Challenges
- File: `04-social-challenges.png`
- Route: `/challenges`
- Must show: challenge tabs + populated card state

### SHOT-05: Leaderboard Progression
- File: `05-leaderboard.png`
- Route: `/leaderboard`
- Must show: ranking controls + visible top entries context

### SHOT-06: Profile Progress
- File: `06-profile-progress.png`
- Route: `/profile/me`
- Must show: progression signal (streak/stats/topic performance)

### SHOT-07: Notifications / Re-engagement
- File: `07-notifications.png`
- Route: `/notifications`
- Must show: transmission history + notification items

### SHOT-08: Privacy & Trust Controls
- File: `08-privacy-controls.png`
- Route flow: `/profile/me` -> `SETTINGS`
- Must show: Danger Zone and account deletion controls

## Overlay Guidance
- One headline per frame (4-7 words)
- Optional subtext (single sentence)
- Overlay must stay in safe zone and not hide focal UI
- Consistent visual style across all frames

## Iteration Protocol
1. Capture raw set from manifest.
2. Apply overlays.
3. Run QA + asset validation.
4. Manually review for clipping/readability/focal clarity.
5. Iterate until all gates pass (max 5 passes).
