# Quiz Recommendation Engine — PRD

**Author**: Sahil + Codex  
**Date**: 2026-03-22  
**Status**: Draft

---

## 1. Executive Summary

Discoverability is incomplete without a reliable “play next” system. This PRD defines the recommendation engine required to rank quizzes logically and helpfully across home, post-quiz results, and discovery surfaces.

---

## 2. Problem

Current personalization is limited to lightweight topic bias. There is no robust system for:
- next quiz after completion
- recommendations based on follows
- difficulty progression
- similarity and adjacency
- controlled exploration

---

## 3. Goal

Build a deterministic recommendation engine that returns ranked quiz candidates with clear reasons.

### Product Hypothesis

If Sportstrivia can reliably suggest the next relevant quiz after a completion or on home, then users will play more quizzes per session and browse less manually.

---

## 4. In Scope

- recommendation candidate generation
- ranking heuristics
- reason/explanation strings
- APIs for home and results surfaces

### MVP Scope

MVP should support two consumer surfaces only:
- post-quiz results “play next”
- personalized home rails

Do not expand to every surface before those two perform well.

---

## 5. Out of Scope

- machine-learning ranking
- reinforcement-learning optimization
- real-time experimentation platform

---

## 6. Recommendation Principles

Recommendations should feel:
- close first
- broader later
- logical, not random

Priority order after a quiz:
1. same collection
2. same entity cluster
3. same sport, similar difficulty
4. followed entities
5. timely/trending nearby
6. one controlled wildcard

---

## 7. Candidate Sources

- same collection
- same topic/entity
- related entities via graph
- same sport
- followed entities
- trending in preferred sports
- editorially boosted quizzes
- unfinished recurring items

---

## 8. Ranking Inputs

Suggested inputs:
- entity overlap
- follow overlap
- collection continuity
- difficulty proximity
- unplayed status
- recency
- popularity
- editorial boost
- freshness

---

## 9. Functional Requirements

| ID | Requirement | Priority |
|---:|-------------|:--------:|
| FR1 | System returns ranked next-quiz recommendations | P0 |
| FR2 | Recommendations include explanation labels | P0 |
| FR3 | System excludes recently completed or ineligible items | P0 |
| FR4 | Results page can request “play next” rail | P0 |
| FR5 | Home can request multiple recommendation rails | P0 |
| FR6 | Recommendation logic supports follows and collections | P1 |

### MoSCoW

- Must:
  - deterministic ranking
  - clear explanation labels
  - exclusions for recently played/ineligible content
  - post-quiz results rail
- Should:
  - home rails
  - follow-aware ranking
  - collection continuity
- Could:
  - entity page recommendations
- Won't for MVP:
  - ML ranking

---

## 10. API Requirements

Need recommendation endpoints/services for:
- `postQuizNext`
- `homeRails`
- `entityPageRecommendations`

Each item should return:
- quiz id/slug
- score
- reason
- source category

---

## 11. Quality Rules

Recommendations should:
- avoid duplicates across adjacent rails
- avoid already exhausted recurring content
- avoid wild topic jumps unless explicitly in exploration lane
- be capped per source to avoid monotony

---

## 12. Success Metrics

- recommendation CTR
- play-next conversion rate
- session depth after first completion
- diversity without relevance loss

### Exit Criteria

- recommendations are available on results pages
- explanations are trustworthy and non-generic
- play-next conversion beats current browse behavior baseline

---

## 13. Risks

1. recommendation reasons feel fake
Mitigation:
- only emit reasons directly tied to ranking inputs

2. engine overfits to one sport and creates tunnel vision
Mitigation:
- add controlled exploration rails, not random feed mixing

3. cold-start quality is weak
Mitigation:
- use follows, onboarding, and platform popularity fallbacks

---

## 14. Rollout

1. ship deterministic engine internally
2. use on post-quiz results first
3. expand to personalized home
4. expand to entity/topic pages
