# Collections and Series — PRD

**Author**: Sahil + Codex  
**Date**: 2026-03-22  
**Status**: Draft

---

## 1. Executive Summary

Collections turn a set of quizzes into a journey. They are one of the highest-leverage discovery tools because they help users binge within a topic instead of repeatedly searching or browsing from scratch.

This PRD introduces collections as first-class discoverability objects.

---

## 2. Problem

Right now, discovery is quiz-first and topic-first, but not journey-first. Users can find individual quizzes, but there is no durable concept of:
- a themed series
- a curated path
- a “continue this set” experience

That reduces depth and replayability.

---

## 3. Goal

Enable editorial and system-generated collections that:
- group related quizzes
- support binge play
- create strong thematic entry points

### Product Hypothesis

If users are given guided quiz journeys instead of isolated quiz cards, then session depth, repeat play, and topic exploration will increase.

---

## 4. In Scope

- collection model
- collection landing pages
- collection rails
- continue collection progress
- editorial and auto-curated collections

### MVP Scope

MVP should focus on editorial collections only.

Initial examples:
- IPL Mega Collection
- Manchester United Challenge Series
- Cricket World Cup Finals
- Hardcore Football Fan Collection

Auto-curated collections should be deferred until entity graph and recommendation primitives are stable.

---

## 5. Out of Scope

- collaborative collection building
- user-generated public collections
- advanced progression mechanics beyond ordering and progress

---

## 6. Collection Types

Minimum supported types:
- editorial collection
- event collection
- team collection
- tournament collection
- difficulty collection
- format collection
- auto-generated recommendation collection

---

## 7. Functional Requirements

| ID | Requirement | Priority |
|---:|-------------|:--------:|
| FR1 | Admins can create and manage collections | P0 |
| FR2 | Collections can contain ordered quizzes | P0 |
| FR3 | Collections can be attached to topics/entities | P0 |
| FR4 | Users can view collection pages and start/resume them | P0 |
| FR5 | Home and discover can surface collections | P0 |
| FR6 | System can support auto-curated collections later | P1 |

### MoSCoW

- Must:
  - collection model
  - ordered quiz membership
  - collection page
  - continue collection progress
- Should:
  - collection rails on home/discover/topic pages
- Could:
  - auto-generated collections
- Won't for MVP:
  - public user-generated collections

---

## 8. Data Model Requirements

Recommended models:
- `Collection`
  - name
  - slug
  - description
  - cover image
  - status
  - collection type
  - primaryTopicId optional
  - rulesJson optional

- `CollectionQuiz`
  - collectionId
  - quizId
  - order

- `UserCollectionProgress`
  - userId
  - collectionId
  - startedAt
  - lastPlayedAt
  - completedQuizCount
  - completedAt optional

---

## 9. UX Requirements

Collection page should show:
- collection hero
- summary
- quiz count
- progress
- ordered quiz list
- next recommended quiz in collection

Discovery surfaces should support:
- featured collections
- continue collection
- collections by sport/team/tournament

---

## 10. Success Metrics

- collection starts
- collection completion rate
- average quizzes played per collection session
- repeat visits to collection pages

### Exit Criteria

- at least 10 high-quality collections exist
- users can start and resume collections
- home or discover can surface collections as first-class units

---

## 11. Risks

1. collections become manual editorial overhead
Mitigation:
- start with high-value editorial collections only

2. collections duplicate topic pages
Mitigation:
- collections are journeys, topics are hubs

3. weak collection quality
Mitigation:
- require strong naming, clear promise, and coherent ordering

---

## 12. Rollout

1. add collection model and admin
2. seed 10 to 20 high-quality collections
3. expose collection rails on home/discover/topic pages
4. add continue-collection logic
