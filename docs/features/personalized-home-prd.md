# Personalized Home — PRD

**Author**: Sahil + Codex  
**Date**: 2026-03-22  
**Status**: Draft

---

## 1. Executive Summary

Authenticated users should not be redirected to a generic quiz library. They should land on a relevance-first home that helps them immediately continue, resume, or discover the next best quiz.

This PRD defines the logged-in home experience for web and mobile.

---

## 2. Problem

Current logged-in entry sends users to `/quizzes`, which is useful as a library but weak as a home experience.

This creates several issues:
- too much browsing overhead
- weak sense of “this app knows me”
- poor continuity after prior play
- no clear next-best action

---

## 3. Goal

Create an authenticated home page that:
- feels personal
- reduces time to first play
- supports streaks and recurrence
- highlights favored sports first

### Product Hypothesis

If authenticated users land on a relevance-first home instead of a generic library, then time to first play and repeat engagement will improve.

---

## 4. In Scope

- authenticated home route and modules
- ranked home sections
- fallback logic for new users
- cross-platform content logic

### MVP Scope

MVP should ship only after recommendation and interest inputs are credible.

MVP modules:
- continue playing
- daily challenge
- because you like X
- from your follows
- one trending rail

---

## 5. Out of Scope

- redesign of the public marketing homepage
- fully ML-ranked home feed
- infinite mixed feed

---

## 6. Home Principles

Home should answer:
- what should I play now?
- what should I continue?
- what is relevant to my sports world?
- what is timely today?

Home should not feel like:
- a generic browse page
- an unranked content shelf
- a noisy mixed-sport feed

---

## 7. Required Modules

| Module | Priority | Notes |
|---|:---:|---|
| Continue Playing | P0 | Resume recurring or recently attempted content |
| Daily Challenge | P0 | Always visible |
| Because You Like X | P0 | Based on interests/follows/history |
| From Your Teams / Tournaments | P0 | Follow-based rail |
| Trending in Your Sports | P1 | Not global-only |
| New for You | P1 | Unplayed but relevant |
| Cross-Sport Wildcard | P2 | Controlled exploration |

### MoSCoW

- Must:
  - authenticated home route
  - continue playing
  - daily challenge
  - interest/follow-based rails
- Should:
  - timely rail
  - explanation labels
- Could:
  - wildcard exploration
- Won't for MVP:
  - infinite feed
  - heavy editorial experimentation

---

## 8. Ranking Logic

Initial ranking order:
1. continue playing
2. daily challenge
3. strongest interest rail
4. follow-based rail
5. timely/trending rail
6. exploration rail

For new users:
1. daily challenge
2. picked sports from onboarding
3. platform trending
4. starter collections

---

## 9. Functional Requirements

| ID | Requirement | Priority |
|---:|-------------|:--------:|
| FR1 | Logged-in users land on personalized home instead of generic library | P0 |
| FR2 | Home includes continue-playing state | P0 |
| FR3 | Home prioritizes user sports/interests/follows | P0 |
| FR4 | Home supports new-user fallback logic | P0 |
| FR5 | Home includes timely modules | P1 |
| FR6 | Home exposes explanation labels like “Because you play cricket” | P1 |

---

## 10. API Requirements

Need one aggregated home payload:
- user summary
- streak state
- continue playing rail
- recommended rails
- timely rails
- fallback modules

This should be server-rendered where possible.

---

## 11. Success Metrics

- time to first quiz start from home
- home-to-play CTR
- repeat visit rate
- session depth after home entry
- reduction in generic browse dependency

### Exit Criteria

- personalized home outperforms the current `/quizzes` entry for logged-in users on engagement metrics
- at least 70% of home sessions render at least one genuinely personalized rail

---

## 12. Risks

1. home becomes too crowded
Mitigation:
- cap modules and enforce ranking

2. shallow personalization feels fake
Mitigation:
- only show “because you like” when signal quality is real

3. too much cross-sport noise
Mitigation:
- keep wildcard rail constrained

---

## 13. Rollout

1. internal beta for authenticated users
2. measure CTR vs current `/quizzes` redirect
3. make personalized home default
4. keep `/quizzes` as explicit browse/discover surface
