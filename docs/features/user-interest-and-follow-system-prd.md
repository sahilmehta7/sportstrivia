# User Interest and Follow System — PRD

**Author**: Sahil + Codex  
**Date**: 2026-03-22  
**Status**: Draft

---

## 1. Executive Summary

Sportstrivia currently infers some affinity from play history and supports `favoriteTeams`, but this is not enough to drive strong discoverability.

This PRD introduces:
- explicit user preference capture
- follow behavior for typed entities
- a unified interest profile for discovery

---

## 2. Problem

The product cannot currently answer these questions well enough:
- what sports does this user explicitly care about?
- which teams, players, or tournaments should appear more often?
- what difficulty and format does the user prefer?
- what should the home feed prioritize?

Behavioral telemetry alone is not enough, especially for new users.

---

## 3. Goal

Build a first-class user interest layer that combines:
- explicit preferences
- follows
- observed behavior

### Product Hypothesis

If users can explicitly tell Sportstrivia what they care about, and the product can persist that signal alongside behavioral telemetry, then home relevance, recommendation quality, and repeat engagement will improve, especially for new and light users.

---

## 4. In Scope

- onboarding preference capture
- profile preference editing
- follow/unfollow for topics/entities
- interest scoring model
- APIs for retrieving user interests

### MVP Scope

MVP should include:
- sports selection
- follow/unfollow for typed entities
- lightweight onboarding capture
- profile management for interests
- deterministic interest profile service

---

## 5. Out of Scope

- social feed based on follows
- notifications for every followed entity event
- machine-learned personalization

---

## 6. Functional Requirements

| ID | Requirement | Priority |
|---:|-------------|:--------:|
| FR1 | Users can select favorite sports during onboarding | P0 |
| FR2 | Users can select favorite teams, athletes, and tournaments | P0 |
| FR3 | Users can follow/unfollow supported entities | P0 |
| FR4 | Users can update preferences later from profile/settings | P0 |
| FR5 | System computes an interest profile from explicit + implicit signals | P0 |
| FR6 | Interest profile is queryable by home, search, and recommendations | P0 |
| FR7 | Difficulty and format preferences are captured | P1 |

### MoSCoW

- Must:
  - favorite sports onboarding
  - follow/unfollow entities
  - profile editing
  - interest profile API
- Should:
  - difficulty preference
  - format preference
- Could:
  - notification preferences per followed entity
- Won't for MVP:
  - social feed
  - deep notification automation

---

## 7. Data Model Requirements

Recommended additions:

### 7.1 Explicit preferences
- `UserInterestPreference`
  - `userId`
  - `topicId`
  - `preferenceType` (`SPORT`, `TEAM`, `ATHLETE`, `TOURNAMENT`, `ORG`)
  - `source` (`ONBOARDING`, `PROFILE_EDIT`, `IMPORT`)
  - `weight`

### 7.2 Follow model
- `UserFollowedTopic`
  - `userId`
  - `topicId`
  - `createdAt`
  - optional notification preferences later

### 7.3 Derived interest profile
Can be computed on demand initially, then materialized later.
Sources:
- follows
- explicit picks
- quiz attempts
- user topic stats
- search history

---

## 8. UX Requirements

### Onboarding
Ask simple, high-signal questions:
- which sports do you follow?
- do you support any teams?
- any players or tournaments you care about?
- what kind of challenge do you enjoy?

Rules:
- must be skippable
- must feel lightweight
- must improve the next screen immediately

### Profile/Settings
Users must be able to:
- add/remove interests
- view followed entities
- change challenge preference

### Entity pages
If a topic/entity is followable, show:
- `Follow`
- `Following`

---

## 9. Interest Scoring

The user interest profile should combine:
- explicit preference weight
- follow weight
- recency of interaction
- quiz completions
- search frequency
- success/engagement in related topics

Deterministic heuristic v1 is sufficient.

### Ranking Guidance

Suggested precedence:
1. follows
2. explicit onboarding/profile picks
3. recent completions
4. topic stats
5. search behavior

Explicit signals should dominate cold-start behavior.

---

## 10. Success Metrics

- onboarding preference completion rate
- % of active users following at least one entity
- home recommendation CTR lift for users with follows
- repeat play lift for followed entities

### Exit Criteria

- a new user can pick interests and immediately see changed discovery output
- an existing user can follow an entity from its page
- downstream services can retrieve a stable interest profile for a user

---

## 11. Risks

1. onboarding becomes too heavy
Mitigation:
- keep it short and skippable

2. follows become redundant with preferences
Mitigation:
- preferences are initial profile signals, follows are durable interest actions

3. empty states for low-data users
Mitigation:
- popular sports fallback

---

## 12. Rollout

1. add models and APIs
2. ship onboarding capture
3. ship follow buttons on typed entity pages
4. expose interest profile to home/recommendation systems

### Dependencies

- entity graph readiness
- typed entity pages that can display follow actions
