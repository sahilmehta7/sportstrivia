# Sportstrivia Growth Plan: Prioritized Build-Next Checklist

Source references:
- Existing growth plan: `/Users/sahilmehta/sportstrivia-2/docs/plans/sportstrivia-growth-plan.md`
- Current-state implementation review (Feb 23, 2026)

## Prioritization Framework
- Primary goal: maximize shares per completed quiz (SPCQ) and invite acceptance.
- Ordering logic: unblock core viral loop first, then conversion polish, then SEO scale, then distribution leverage.

## P0: Must Ship First (Week 1, Growth-Critical)

### 1) Challenge Deep-Link Landing Flow
- Priority: P0
- Outcome: shared challenge links open a landing page with challenger context and one-click quiz start.
- Scope:
  - Public challenge landing page with: “Beat {name}’s score: {score}/{total}”.
  - CTA: `Start Quiz`.
  - Post-completion comparison: user score vs challenger score.
- Dependencies: none.
- Success metrics:
  - `challenge_open -> challenge_accept` >= 15%.
  - Share-to-start conversion improvement week-over-week.

### 2) Results CTAs for Viral Loop
- Priority: P0
- Outcome: each completion drives outbound challenge actions.
- Scope:
  - On results page, add explicit CTAs:
    - `Challenge on WhatsApp`
    - `Copy link`
  - Use challenge copy template:
    - `I scored {score}/{total} on Sportstrivia’s {quiz_title} 🏆 Beat me: {challenge_link}`
- Dependencies: item 1 (challenge link target).
- Success metrics:
  - SPCQ >= 0.15 (good), target 0.30 (great).

### 3) Missing Event Instrumentation
- Priority: P0
- Outcome: full funnel observability.
- Scope:
  - Add events:
    - `share_click_whatsapp`
    - `share_click_copy`
    - `challenge_open`
    - `challenge_accept`
    - `challenge_complete`
    - `topic_view`
    - `quiz_view`
- Dependencies: items 1–2.
- Success metrics:
  - Event coverage > 95% on relevant user flows.

### 4) Complete Challenge Lifecycle on Quiz Completion
- Priority: P0
- Outcome: challenge state closes correctly with measurable outcomes.
- Scope:
  - Persist challenged user’s score when challenge attempt completes.
  - Set challenge status to `COMPLETED` when both participants have scores.
  - Trigger completion notification and results modal readiness.
- Dependencies: item 1.
- Success metrics:
  - >90% accepted challenges reach terminal state (`COMPLETED`/`DECLINED`).

### 5) Eliminate “No Cover” Quiz Cards
- Priority: P0
- Outcome: cleaner browse UX and better conversion.
- Scope:
  - Ensure all visible quiz cards have a cover image.
  - If asset missing, use deterministic branded fallback image (not “No cover” text tile).
- Dependencies: none.
- Success metrics:
  - 0 “No Cover” cards on home/quizzes/topics surfaces.

## P1: High-Impact Follow-Ups (Week 1–2)

### 6) Daily Quiz CTA Placement on Topic + Quiz Pages
- Priority: P1
- Outcome: daily quiz traffic from high-intent pages.
- Scope:
  - Add “Play today’s {sport} Daily Quiz” module on:
    - topic detail pages
    - quiz detail pages
  - Secondary link: “See past {sport} quizzes”.
- Dependencies: none.
- Success metrics:
  - Daily quiz starts from non-`/quizzes` pages +20%.

### 7) Reduce Empty-Shelf Friction on `/topics`
- Priority: P1
- Outcome: topic directory becomes play-first.
- Scope:
  - Sort topics by playable inventory.
  - Hide empty topics or mark `Coming Soon` + `Follow` CTA.
- Dependencies: none.
- Success metrics:
  - Topic-to-quiz CTR +15%.

### 8) Topic SEO Content Template
- Priority: P1
- Outcome: topic pages become rankable landing pages.
- Scope:
  - Standard blocks for each topic page:
    - SEO H1
    - 250–400 word intro
    - FAQ section
    - internal links (daily quiz, related topics, best quizzes)
- Dependencies: none.
- Success metrics:
  - >90% target topic pages with full template.

### 9) Technical SEO Hardening for Topic Pages
- Priority: P1
- Outcome: stronger indexation quality.
- Scope:
  - Canonical on topic pages.
  - Ensure indexable defaults.
  - FAQ schema output where FAQ block exists.
- Dependencies: item 8.
- Success metrics:
  - No major canonical/indexation warnings in GSC for topic set.

### 10) Canonicalize Taxonomy Duplication
- Priority: P1
- Outcome: avoid split ranking signals (e.g., football/soccer variants).
- Scope:
  - Canonical mapping for duplicate concepts.
  - Redirect alias slugs to canonical slug.
- Dependencies: item 9.
- Success metrics:
  - Duplicate-topic split traffic/ranking reduced on monitored terms.

## P2: Content Engine Scale (Week 3)

### 11) Publish 30 Long-Tail Quiz Landing Pages
- Priority: P2
- Outcome: increase rankable surface area.
- Scope:
  - Standardized long-tail quiz page format.
  - Target patterns:
    - `{Team} trivia quiz`
    - `{Tournament} quiz`
    - `Hardest {sport} trivia`
- Dependencies: items 8–10.
- Success metrics:
  - 30 pages live; impressions trend upward.

### 12) Hub-Spoke Clusters for Top Topics
- Priority: P2
- Outcome: internal linking and session depth improve.
- Scope:
  - Add hub sections:
    - `Best quizzes`
    - `Newest`
    - `Hardest`
  - Link spoke quizzes back to hub.
- Dependencies: item 11.
- Success metrics:
  - Hub-to-spoke CTR > 20%.

### 13) Publishing QA Gate
- Priority: P2
- Outcome: consistent quality at scale.
- Scope:
  - Checklist gate before publish:
    - metadata
    - schema
    - internal links
    - cover image
    - analytics events
- Dependencies: items 8–12.
- Success metrics:
  - <5% of pages need post-publish fixes.

## P3: Distribution Productization (Week 4)

### 14) Partner Leaderboard Pages
- Priority: P3
- Outcome: support co-branded distribution and collabs.
- Scope:
  - Route: `/leaderboard/{partner}`.
  - Branded header + scoped ranking.
- Dependencies: P0 complete.
- Success metrics:
  - Supports 10+ partnership activations.

### 15) Partnership Attribution Tracking
- Priority: P3
- Outcome: measurable partnership ROI.
- Scope:
  - Track partner/source tags through quiz starts and completions.
  - Weekly partner funnel view.
- Dependencies: item 14.
- Success metrics:
  - Per-partner conversion visibility with weekly reporting.

## P4: Post-Core Backlog

### 16) UGC Quiz Submission MVP
- Priority: P4

### 17) Creator Profile Pages
- Priority: P4

### 18) Embeddable Quiz Widget
- Priority: P4

## Implementation Sequence
1. P0 items 1 -> 4 (core viral loop) then item 5.
2. P1 items 6 -> 10 (conversion + SEO baseline).
3. P2 items 11 -> 13 (content scaling).
4. P3 items 14 -> 15 (distribution leverage).
5. P4 items 16 -> 18 (expansion).

## Weekly Scoreboard (Minimum)
- SPCQ
- Invite acceptance rate
- Quiz completion rate
- D1 and D7 retention
- Top landing pages by starts/completes
- Challenge funnel: open -> accept -> complete
