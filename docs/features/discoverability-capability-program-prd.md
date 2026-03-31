# Discoverability Capability Program — PRD Bundle

**Author**: Sahil + Codex  
**Date**: 2026-03-22  
**Status**: Active (Partially Implemented)

---

## 1. Executive Summary

Sportstrivia already has meaningful discovery primitives:
- quiz library
- topic hubs
- daily games
- search
- user topic stats
- streaks and leaderboards

What it does not yet have is the full capability stack required to deliver a true sport-first, personalized discoverability strategy across web and mobile.

This program defines the capability build-out required before broad strategy execution. The goal is to avoid launching a high-level discoverability vision on top of incomplete product infrastructure.

### Implementation Snapshot (2026-03-30)

Implemented:
- typed topic follow/unfollow APIs are live
- explicit interests API and deterministic interest profile API are live
- authenticated interest capture gate/flow is live and now suppresses repeat prompting based on saved intent
- onboarding and explicit interests enforce followable + `entityStatus = READY`
- `GET /api/topics` now exposes `entityStatus` and honors `page`/`limit` in non-search mode

Still pending:
- collections as a complete discovery journey layer
- entity-aware blended search results
- recommendation engine rollout
- relevance-first authenticated home as primary entry surface

---

## 2. Program Goal

Build the foundational capabilities that allow Sportstrivia to:
- understand what each user cares about
- model sports entities consistently
- let users follow those entities
- curate and sequence quizzes into collections
- recommend the next best quiz
- support sport-aware, entity-aware retrieval
- power a personalized home experience

### Program Outcome

If this program succeeds, Sportstrivia should be able to shift from:
- a quiz catalog with topic pages

to:
- a relevance-first sports discovery product where users can reliably find the right quiz now and the next quiz after that.

---

## 3. Strategic Principle

Do not execute the full discoverability strategy until the underlying capabilities exist.

Sequence:
1. Build the capability layer
2. Validate internal tooling and data quality
3. Roll capabilities into user-facing surfaces
4. Measure discoverability outcomes

---

## 4. Capability PRD Set

This program is split into the following PRDs:

1. `topic-entity-graph-prd.md`
Purpose:
- harden the existing `Topic` model into a usable entity backbone

2. `user-interest-and-follow-system-prd.md`
Purpose:
- capture explicit preferences and follows for sports, teams, tournaments, athletes, and organizations

3. `personalized-home-prd.md`
Purpose:
- create a true authenticated home experience driven by relevance

4. `collections-and-series-prd.md`
Purpose:
- support curated and system-generated quiz journeys

5. `quiz-recommendation-engine-prd.md`
Purpose:
- rank and explain “play next” recommendations

6. `sport-aware-search-prd.md`
Purpose:
- upgrade search from quiz/topic lookup to blended entity-aware retrieval

---

## 5. Why This Order

### Phase 1: Data and identity
- `topic-entity-graph-prd.md`
- `user-interest-and-follow-system-prd.md`

Without these, the product does not know what entities exist or which ones matter to a user.

### Phase 2: Retrieval and sequencing
- `collections-and-series-prd.md`
- `sport-aware-search-prd.md`

Without these, users cannot move through content cleanly or retrieve the exact sports object they want.

### Phase 3: Intelligence and entry point
- `quiz-recommendation-engine-prd.md`
- `personalized-home-prd.md`

These should be built after the identity, follow, and retrieval layers exist, otherwise personalization will be shallow and brittle.

---

## 6. Prioritization Framework

This program uses a pragmatic prioritization model based on:
- strategic necessity
- dependency criticality
- user-facing value unlocked
- implementation risk reduction

### Priority Tiers

| Capability | Tier | Why |
|---|:---:|---|
| Topic Entity Graph | P0 | Foundational dependency for search, follows, recommendations, and typed hubs |
| User Interest and Follow System | P0 | Required to know what should be personalized |
| Collections and Series | P1 | High user value, lower dependency than search/recommendations, enables journey-based discovery |
| Sport-Aware Search | P1 | Critical precision surface; should ship after entity contracts exist |
| Quiz Recommendation Engine | P1 | Needed for “play next” and personalized rails, depends on entity graph and interests |
| Personalized Home | P2 | Highest visible value, but should not ship until recommendation quality is acceptable |

### Sequence Logic

- `P0` items are platform prerequisites.
- `P1` items convert that platform into usable discovery capabilities.
- `P2` is the primary presentation layer that should sit on top of the earlier work.

---

## 7. Current State Summary

### Already present
- topic hierarchy
- quiz metadata for sport, difficulty, tags, and topic linkage
- user topic stats
- search telemetry
- topic hub pages
- quiz list filtering

### Missing or partial
- explicit user interest graph consumers on major discovery surfaces
- recommendation and home consumers of interest profile
- collections
- entity-aware search results
- recommendation engine
- personalized authenticated home
- typed entity contracts and relationship quality at full coverage

---

## 8. Non-Goals

- redesign every browse surface immediately
- execute editorial strategy before capabilities are ready
- split all entities into separate tables in this phase
- optimize machine-learning ranking before deterministic heuristics are in place

---

## 9. Success Criteria

This capability program is complete when:
- the product can represent typed sports entities reliably
- a user can follow entities and express interests
- quizzes can be grouped into collections
- search can resolve quizzes and entities precisely
- recommendation APIs can return ranked next-play candidates
- authenticated users land on a relevance-first home experience

### Program-Level KPIs

- % of authenticated sessions entering a relevance-first home
- home-to-play CTR
- search success rate for entity queries
- post-quiz “play next” conversion
- average quizzes played per session
- D7 retention lift for users with preferences/follows vs users without

---

## 10. Recommended Delivery Model

Engineering should treat these PRDs as a staged platform track, not isolated feature tickets.

Recommended implementation sequence:
1. entity graph
2. interests + follows
3. collections
4. search upgrade
5. recommendation engine
6. personalized home

---

## 11. Dependencies

- existing `Topic` model with `schemaType` and `schemaEntityData`
- quiz/topic linking via `QuizTopicConfig` and question topic references
- user telemetry via attempts, topic stats, and search query logs

---

## 12. Risks

1. Overloading `Topic` without strong contracts
Mitigation:
- typed validation per entity type

2. Shipping personalization before data quality is trustworthy
Mitigation:
- ship deterministic heuristics first

3. Building search and recommendations on incomplete relationships
Mitigation:
- define entity relationship rules early in the entity graph phase

4. Shipping a personalized home before recommendation quality is credible
Mitigation:
- treat home as a consumer of capabilities, not the first capability to build

---

## 13. Delivery Gates

Do not start the next tier until the current tier passes these gates.

### Gate A: Identity Ready
- typed entity schemas implemented
- relationship model available
- top sports entities backfilled

### Gate B: Interest Ready
- users can express explicit interests
- follows are live
- interest profile API is available

Gate B status (as of 2026-03-30): **Passed**.

### Gate C: Retrieval Ready
- collections exist
- entity-aware search returns typed results
- recommendation service returns ranked candidates with reasons

### Gate D: Presentation Ready
- personalized home beats or matches `/quizzes` on engagement metrics in test population

---

## 14. Rollout Guidance

Rollout should happen capability by capability, behind internal validation where needed.

Suggested rollout:
1. Admin/data model readiness
2. API readiness
3. internal QA surfaces
4. limited user exposure
5. full discoverability surface adoption
