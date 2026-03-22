# Sport-Aware Search — PRD

**Author**: Sahil + Codex  
**Date**: 2026-03-22  
**Status**: Draft

---

## 1. Executive Summary

Search is already functional for quizzes and topics, but the discoverability strategy requires a more precise, entity-aware search experience. Users should be able to search for teams, players, tournaments, organizations, and quiz collections, not just quiz titles or generic topics.

---

## 2. Problem

The current search stack is quiz/topic-centric. It does not fully support:
- typed entity retrieval
- blended results
- query intent detection
- best destination routing

As a result, search precision will degrade as the content graph grows.

---

## 3. Goal

Upgrade search so users can quickly reach the exact sports world they intend:
- quiz
- sport hub
- team
- athlete
- tournament
- organization
- collection

### Product Hypothesis

If search can resolve sports entities directly instead of forcing users through generic quiz/topic results, then search success rate and discovery precision will improve.

---

## 4. In Scope

- blended result model
- typed search result cards
- alias-aware entity resolution
- query intent ranking
- improved suggestion behavior

### MVP Scope

MVP should cover:
- blended search API
- typed result cards
- alias-aware entity resolution
- suggestions that include entities

Scoped out of MVP:
- semantic search
- natural-language interpretation beyond deterministic heuristics

---

## 5. Out of Scope

- full natural-language semantic retrieval stack
- external web search
- conversational search UI

---

## 6. Search Principles

Search should optimize for:
- precision first
- entity resolution before broad browse
- best destination over biggest result list

Examples:
- “ipl” -> tournament hub
- “india cricket” -> team/nation or sport hub depending ranking
- “messi” -> athlete entity page
- “hard tennis” -> filtered quiz results or tennis hard-mode collection

---

## 7. Result Types

Supported result types:
- `QUIZ`
- `SPORT`
- `TEAM`
- `ATHLETE`
- `TOURNAMENT`
- `ORGANIZATION`
- `COLLECTION`

---

## 8. Functional Requirements

| ID | Requirement | Priority |
|---:|-------------|:--------:|
| FR1 | Search returns blended result types | P0 |
| FR2 | Results expose type-specific labels and destinations | P0 |
| FR3 | Suggestions support typed entities, not just prior queries | P0 |
| FR4 | Search supports aliases and normalized names | P0 |
| FR5 | Search can prefer best-match entity over generic quiz list | P1 |
| FR6 | Search can filter within a sport/entity context | P1 |

### MoSCoW

- Must:
  - blended results
  - typed destinations
  - alias support
  - entity suggestions
- Should:
  - context-aware filtering
  - best-result routing
- Could:
  - richer query intent handling
- Won't for MVP:
  - conversational search

---

## 9. Retrieval Model

Initial ranking can combine:
- exact alias match
- exact slug/name match
- typed entity priority
- popularity
- follow affinity
- recency
- text match strength

Blended search should not be a flat mixed list without grouping.

Recommended presentation:
- top result
- entities
- quizzes
- collections

---

## 10. Suggestion Requirements

Suggestion sources:
- recent searches
- trending searches
- followed entities
- popular entities
- exact alias matches

If the user has strong interest/follow data, suggestions should bias toward those entities.

---

## 11. Success Metrics

- search-to-click rate
- search precision for entity queries
- % of searches resolved to direct entity destinations
- reduced pogo-sticking between search and browse

### Exit Criteria

- top entity searches resolve to typed destinations
- entity suggestions appear in autocomplete
- entity queries outperform current search baseline on click-through and destination accuracy

---

## 12. Risks

1. mixed results become confusing
Mitigation:
- typed grouping and best-result treatment

2. entity aliases cause collisions
Mitigation:
- maintain canonical aliases and tie-breakers by type/popularity

3. search suggestions become stale query logs
Mitigation:
- blend telemetry with live entity candidates

---

## 13. Rollout

1. add entity search index/contract
2. add blended result API
3. add typed UI
4. upgrade suggestions
5. wire search into personalized signals
