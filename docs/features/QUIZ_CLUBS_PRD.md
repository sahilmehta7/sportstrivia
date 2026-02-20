# Quiz Clubs (Groups) — PRD

**Author**: Sahil + Codex  
**Date**: 2026-02-19  
**Status**: Draft (Ready for Engineering/Design review)

---

## 1. Executive Summary

### Problem Statement
SportsTrivia has strong solo play and 1:1 social features (friends/challenges), but lacks a “home base” for communities to compete together and return daily with shared context.

### Proposed Solution
Introduce **Quiz Clubs** (previously “Groups”): community spaces that curate **Featured quiz slates** and run **club competitions** through **Daily (per-slate) leaderboards**, **All‑time leaderboards**, and **async tournament leaderboard-races**. Support **Open Clubs** (discoverable, instant join) and **Private Clubs** (invite-only).

### Business Impact (Expected)
- Increase retention via recurring shared rituals (daily slates + standings).
- Create scalable community identity (club badges, rivalry-style competitions) without needing chat v1.
- Improve organic growth via discoverable Open Clubs and shareable invite links.

### Timeline (High-Level)
- MVP (v1 Async): 2–4 weeks depending on polish and data backfill needs.
- v1.5 Live Sessions: +2–4 weeks after MVP.

### Resources Required
- 1–2 engineers (full stack), 1 designer (part-time), 1 QA pass.

### Success Metrics (Targets / Guardrails)
- Adoption: % of DAU in ≥1 Quiz Club
- Engagement: featured-slate attempts per member per day
- Retention: D7 retention lift for members vs non-members
- Quality: p95 leaderboard endpoints < 300ms; error rate < 1%

---

## 2. Problem Definition

### 2.1 Customer Problem
- **Who**: SportsTrivia players who enjoy competing with friends or fandom communities (teams, leagues, countries, colleges).
- **What**: They want a persistent community competition experience beyond 1:1 challenges.
- **When**: Daily “check-in” moments, game nights, tournaments, major sports events.
- **Why**: Friends/challenges are limited to direct relationships; leaderboards are global and lack identity/context.
- **Impact**: Lower stickiness and fewer reasons to return daily; reduced network effects.

### 2.2 Opportunity
Quiz Clubs create lightweight community infrastructure:
- A home base for fandom identity (“CSK Whistle Podu Army”, “Football Fanatics”).
- Competition surfaces that are fair and themed (club-curated featured quizzes).
- Expandable path toward richer community features (live sessions, rivals, roles/mods, feeds).

---

## 3. Solution Overview

### 3.1 High-Level Description
Quiz Clubs are membership containers that:
- Define **club type**: `OPEN` or `PRIVATE`
- Manage membership and invites
- Maintain a **Featured slate system**: **Pinned slots** + **Rotating slots**
- Run competitions:
  - **Daily Leaderboard** (per-slate; resets daily; slate is locked)
  - **All‑time Leaderboard** (cumulative)
  - **Async Tournaments** (leaderboard-race over a time window, using a fixed slate)

### 3.2 Key Product Decisions (Locked)
- Naming: “Groups” are called **Quiz Clubs**.
- v1 ships **Async** first; v1.5 adds **Live sessions**.
- Two club types:
  - **Open Clubs**: discoverable, anyone can join immediately
  - **Private Clubs**: invite-only; invite links can be open-join or approval-gated (toggle)
- Leaderboards count **Featured-only quizzes** (no generic “activities” scoring in v1).
- Daily leaderboard is **per-slate** (each day = its own leaderboard, resets daily).
- Featured system is **Pins + Auto-Rotation** with cadence:
  - Daily rotation
  - Weekly “big slate”

---

## 4. In Scope / Out of Scope

### 4.1 In Scope (v1 Async MVP)
- Create/manage Quiz Clubs (Open/Private)
- Join/leave flows, membership list
- Invite links + direct invites (Private clubs)
- Featured configuration:
  - Pinned quizzes (owner curated)
  - Rotating quizzes (rules-based)
  - Daily + Weekly-big slates (locked snapshot)
- Leaderboards:
  - Daily per-slate leaderboard
  - All-time leaderboard
- Async tournaments:
  - Leaderboard-race tournament created from a locked slate
  - Tournament leaderboard
- Seeding “Official” Open Clubs (examples: Football Fanatics, CSK Whistle Podu Army)

### 4.2 Out of Scope (for v1)
- Club chat / comments / reactions
- Moderator role and content moderation tooling (Owner-only in v1)
- Monetization, subscriptions, paid clubs
- Advanced personalization of rotating content
- Multi-timezone slate boundaries per club (start with a single global rule)
- “Activity” leaderboards and non-quiz activity points

---

## 5. MVP Definition (v1 Async)

### 5.1 MVP Must-Haves (P0)
- Open Club discovery + join
- Private Club create + invite links + direct invites
- Featured slates with:
  - Pinned slots
  - Rotating slots
  - Slate locking and stable daily leaderboard
- Daily + All-time leaderboards (Featured-only)
- Async tournament race using a slate
- Seed official clubs

### 5.2 MVP Success Criteria (“Working”)
- A new user can discover an Open Club, join, play today’s featured slate, and appear on the daily leaderboard.
- A private club owner can invite a friend via link or direct invite; invitee joins successfully.
- Daily leaderboard is stable for that day (slate locked) and resets next day.
- Tournament standings update correctly from attempt completion events.

---

## 6. User Stories

### US-001 — Discover & Join Open Clubs (P0)
As a player, I want to browse and join Open Quiz Clubs so that I can compete with communities I identify with.

Acceptance Criteria:
- [ ] I can open a Clubs page and see “Official” clubs featured.
- [ ] I can search clubs by name.
- [ ] I can join an Open club immediately.

### US-002 — Create Private Club (P0)
As a player, I want to create a Private Quiz Club so that I can play and compete with my friends.

Acceptance Criteria:
- [ ] I can create a private club with name, description, and cover (optional).
- [ ] I become the owner.

### US-003 — Invite Friends to Private Club (P0)
As a club owner, I want to invite others via link or direct invite so that we can grow the club.

Acceptance Criteria:
- [ ] Owner can generate an invite link.
- [ ] Owner can send a direct invite by email (or user lookup, if available).
- [ ] Private club can configure invite link mode: open-join vs requires approval.

### US-004 — Featured Slates (Pins + Rotation) (P0)
As a club owner, I want to pin key quizzes and auto-rotate others so that the club stays themed and fresh with minimal effort.

Acceptance Criteria:
- [ ] Owner can set an ordered list of pinned quizzes.
- [ ] System auto-selects rotating quizzes according to club “home topics” + simple freshness rules.
- [ ] The daily slate is locked for the day; editing pins affects future slates, not today’s.

### US-005 — Daily & All-Time Leaderboards (P0)
As a member, I want daily and all-time leaderboards based on the club’s featured slate so that competition feels fair and on-theme.

Acceptance Criteria:
- [ ] Daily leaderboard shows standings for a given dateKey.
- [ ] All-time leaderboard shows cumulative points.
- [ ] Only attempts on featured quizzes count.

### US-006 — Async Tournament Race (P0)
As a club owner, I want to run a timeboxed race tournament so that members can compete over a defined window.

Acceptance Criteria:
- [ ] Owner can create a tournament from a locked slate (daily or weekly-big).
- [ ] Members’ tournament points accumulate during the window.
- [ ] Tournament standings are viewable.

---

## 7. Functional Requirements

| ID | Requirement | Priority | Notes |
|---:|-------------|:--------:|------|
| FR1 | Open Clubs are discoverable and instant-join | P0 | “Official” clubs can be seeded and pinned |
| FR2 | Private Clubs support invite links + direct invites | P0 | Invite link mode toggle per club |
| FR3 | Featured system supports pinned + rotating slots | P0 | Daily + weekly-big slate generation |
| FR4 | Daily slates are locked and stable | P0 | Needed for fairness and clarity |
| FR5 | Daily leaderboard is per-slate (resets daily) | P0 | DateKey-based |
| FR6 | All-time leaderboard aggregates slate/tournament points | P0 | Featured-only in v1 |
| FR7 | Async tournaments are leaderboard-races over a time window | P0 | Uses a fixed locked slate |
| FR8 | Seed “Official” Open Clubs | P0 | Football Fanatics, CSK Whistle Podu Army, etc. |
| FR9 | Owner-only management UI in v1 | P0 | Mods later |

---

## 8. Non-Functional Requirements

- **Performance**: Leaderboard endpoints p95 < 300ms at steady state.
- **Scalability**: Support clubs up to ~1,000 members (Open Clubs) without leaderboard timeouts.
- **Data Integrity**: Slate locking must prevent “mid-day” point instability.
- **Security/Privacy**:
  - Private club pages are member-only.
  - Open club pages are publicly viewable, but sensitive detail (e.g., per-question answers) remains private.
  - Owner-only access checks for management endpoints.
- **Abuse controls**:
  - Rate limit joins/invites per user/IP.
  - Owner can remove/ban members (ban can be P1 if needed).

---

## 9. UX / IA (v1)

### Primary Screens
- **Clubs Discover**: list + search + “Official” module
- **Club Home**: join/leave, today’s slate, daily leaderboard CTA, tournament CTA
- **Leaderboards**: Daily (date picker) + All-time
- **Tournaments**: list + detail view
- **Owner Manage**: pins, invite settings, home topics, club type/visibility
- **Invite Link Landing**: accept/join flow

### Design Principles
- **Clarity over completeness**: featured-only scoring; avoid “activity points” ambiguity.
- **Rituals**: highlight “Today’s slate” and “Daily standings” first.
- **Identity**: club cover + emoji + badge shown across quiz play and results.

---

## 10. Technical Specifications (Proposed)

### 10.1 Data Model (Prisma-level entities)
> Final naming may stay “Group” internally for compatibility, but UX copy should be “Quiz Club”.

Core entities:
- `QuizClub` (or `Group`)
- `QuizClubMember`
- `QuizClubInviteLink`
- `QuizClubInvite` (direct)
- `QuizClubJoinRequest` (for approval-gated invites)
- `QuizClubFeaturedPin`
- `QuizClubFeaturedSlate` (daily, weekly-big)
- `QuizClubFeaturedSlateQuiz`
- `QuizClubSlateScore`
- `QuizClubAllTimeScore`
- `QuizClubTournament`
- `QuizClubTournamentScore`

### 10.2 Slate Locking & Leaderboard Computation
- Slates are generated on a schedule (or on-demand when first requested) and then **locked** (snapshot of quizIds).
- Daily leaderboard is keyed by `dateKey` (e.g., `YYYY-MM-DD`) and `clubId`.
- **Do not compute standings by scanning all attempts on each request.**
  - On `attempt complete`, if the attempt’s quizId is in active/locked slate(s) for any club the user is a member of, upsert:
    - `QuizClubSlateScore` (for that slate)
    - `QuizClubAllTimeScore` (for club)
    - `QuizClubTournamentScore` (if tournament active using that slate)

### 10.3 API Endpoints (High-Level)
- `/api/quiz-clubs` (list/create)
- `/api/quiz-clubs/[slug]` (details)
- `/api/quiz-clubs/[id]/join`, `/leave`
- `/api/quiz-clubs/[id]/members`
- `/api/quiz-clubs/[id]/invite-link`, `/invites`
- `/api/quiz-club-invites/[id]/accept|decline`
- `/api/quiz-clubs/[id]/featured-pins`
- `/api/quiz-clubs/[id]/slates/current`
- `/api/quiz-clubs/[id]/leaderboards/daily`
- `/api/quiz-clubs/[id]/leaderboards/all-time`
- `/api/quiz-clubs/[id]/tournaments` (+ detail + leaderboard)

### 10.4 Seeding Official Clubs
- Add seed data for official clubs with:
  - name/slug, cover, emoji, home topics, default pins (optional)
- “Official” clubs appear first on discovery.

---

## 11. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------:|-------:|------------|
| Leaderboards slow at scale | Medium | High | Incremental score tables + indexes; avoid scanning attempts |
| Invite link abuse / raids | Medium | Medium | Join rate limits; optional approval toggle; owner ban/kick |
| Confusing scoring | Medium | High | Featured-only in v1; clear “counts only these quizzes” UI |
| Slate instability | Medium | High | Hard slate locking; day-bound leaderboards keyed by dateKey |
| Stale clubs | Medium | Medium | Auto-rotation + weekly big slate; seed official clubs |

---

## 12. Milestones (Suggested)

1) **Core Clubs**: create/join/leave, discovery, seeded official clubs
2) **Invites**: invite link + direct invites + approval toggle (private clubs)
3) **Featured System**: pins + rotation + daily/weekly slates + locking
4) **Leaderboards**: daily per-slate + all-time (featured-only)
5) **Tournaments**: async leaderboard-race + standings
6) **Polish**: club badge in UI, empty states, rate limits, basic moderation actions (optional)

---

## 13. v1.5 — Live Sessions (Follow-Up PRD Stub)

### Summary
Add scheduled club “live nights”: a start time and play window using a fixed quiz/slate, with a live leaderboard updated via polling (no realtime infra required initially).

### Not in v1.5 (initially)
- Real-time chat/presence
- Reactions/emoji storms
- Websocket infrastructure (can be added later)

