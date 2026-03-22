# Topic Entity Graph — PRD

**Author**: Sahil + Codex  
**Date**: 2026-03-22  
**Status**: Draft

---

## 1. Executive Summary

Sportstrivia already uses `Topic` as a hierarchical content model. This PRD upgrades that model into a durable entity graph for discoverability without prematurely splitting entities into many tables.

The key idea:
- keep `Topic` as the canonical entity backbone
- use `schemaType` to classify entity type
- add strict typed payloads and explicit entity relationships

This keeps the model flexible while making it reliable enough for search, follows, recommendations, and personalized discovery.

---

## 2. Problem

Today, `Topic` is structurally useful but not yet strong enough to act as the full foundation for:
- team pages
- athlete pages
- tournament pages
- organization pages
- cross-entity recommendations
- typed entity search

The main missing pieces are:
- per-type contracts
- explicit relationships
- derived discovery fields
- operational rules for entity quality

---

## 3. Goal

Turn `Topic` into a typed entity graph that can safely power:
- sport hubs
- team/athlete/tournament/org hubs
- followable entities
- entity-aware search
- recommendation adjacency

### Product Hypothesis

If Sportstrivia can model sports entities with typed metadata and explicit relationships, then search, follows, recommendations, and sport-specific discovery surfaces will become materially more precise and scalable.

---

## 4. In Scope

- define supported `schemaType` usage for discoverability entities
- define strict `schemaEntityData` contracts per type
- add explicit topic-to-topic relationship support
- add derived discovery fields or computed scores
- add validation and admin affordances

### MVP Scope

MVP should cover only the entities needed for the first discoverability wave:
- sport
- team
- athlete
- tournament
- organization

Do not attempt full graph completeness across every sport before consumer features can use the output.

---

## 5. Out of Scope

- full migration to separate entity tables
- external stats ingestion beyond minimal metadata
- auto-building a perfect sports knowledge graph from third-party sources

---

## 6. Supported Entity Types

Minimum supported types for discoverability:
- `SPORT`
- `TEAM`
- `ATHLETE`
- `TOURNAMENT`
- `ORGANIZATION`
- `COLLECTION` optional later, but recommended if reused in the same backbone

If `TopicSchemaType` currently uses different enum names, the implementation should map to equivalent semantics.

---

## 7. Functional Requirements

| ID | Requirement | Priority |
|---:|-------------|:--------:|
| FR1 | Every entity topic must have a valid `schemaType` | P0 |
| FR2 | Every entity topic must have type-specific validated `schemaEntityData` | P0 |
| FR3 | Topics must support explicit typed relationships to other topics | P0 |
| FR4 | Entity topics must expose canonical aliases for search and resolution | P0 |
| FR5 | Entity topics must expose discovery readiness fields | P1 |
| FR6 | Admin tooling must surface invalid or incomplete entities | P1 |

---

## 8. Data Model Requirements

### 8.1 Keep `Topic` as canonical entity object

Continue using:
- `name`
- `slug`
- `schemaType`
- `schemaEntityData`
- parent/child hierarchy

### 8.2 Add topic relationship table

Recommended model:
- `TopicRelation`
  - `fromTopicId`
  - `toTopicId`
  - `relationType`

Suggested relation types:
- `BELONGS_TO_SPORT`
- `PLAYS_FOR`
- `REPRESENTS`
- `COMPETES_IN`
- `ORGANIZED_BY`
- `RIVAL_OF`
- `RELATED_TO`

V1 simplification:
- relations represent current state only
- non-sport entities must have exactly one sport anchor
- relation weighting and historical modeling are out of scope

### 8.3 Define strict entity payloads

Examples:

#### TEAM
- `sport`
- `country`
- `leagueIds`
- `organizationIds`
- `foundedYear`

#### ATHLETE
- `sport`
- `country`
- `teamIds`
- `organizationIds`
- `activeYears`

#### TOURNAMENT
- `sport`
- `country`
- `organizerIds`
- `frequency`

#### ORGANIZATION
- `sport`
- `region`

### 8.4 Derived fields

Recommended additions:
- `playableQuizCount`
- `followCount`
- `popularityScore`
- `trendingScore`
- `entityQualityScore`

These can be materialized later if needed. They do not all need to be columns in v1.

V1 simplification:
- keep derived fields computed, not persisted
- do not add ranking weights to the relation model

### MoSCoW

- Must:
  - typed entity schemas
  - aliases
  - relationship model
  - validation
- Should:
  - derived quality/readiness scores
  - admin preview tools
- Could:
  - richer rivalry and historical relationship modeling
- Won't for MVP:
  - separate entity tables

---

## 9. Validation Requirements

- schema validation must run on create/update
- invalid entity data must block `READY` status
- relationships must reject self-reference unless explicitly allowed
- aliases must be normalized and deduplicated
- aliases are optional search metadata, not a readiness requirement
- non-sport entities must have exactly one `BELONGS_TO_SPORT` relation in v1

---

## 10. Admin Requirements

Admin users need:
- typed entity editor
- relationship editor
- alias editor
- readiness/quality checklist
- preview of how entity will appear in search and hubs

`READY` status is an admin quality signal only in v1. It does not by itself gate public page rendering, search indexing, follows, or recommendations.

---

## 11. Success Metrics

- % of discovery-critical topics with valid entity typing
- % of discovery-critical topics with at least one valid relationship
- search resolution accuracy for typed entities
- recommendation coverage using entity relations

### Exit Criteria

- top sports and their major teams/tournaments/athletes are modeled with valid contracts
- aliases resolve correctly for common search terms
- at least one downstream consumer is reading the entity graph in production-like flows

---

## 12. Risks

1. `schemaEntityData` becomes unstructured junk
Mitigation:
- hard validation by type

2. hierarchy is incorrectly used where graph relationships are needed
Mitigation:
- introduce `TopicRelation`

3. too much modeling work before user value
Mitigation:
- prioritize top sports and highest-traffic entities first

4. relation semantics become too complex too early
Mitigation:
- current-state only in v1
- exactly one sport anchor per non-sport entity
- no historical edges

---

## 13. Rollout

1. define schemas and validators
2. add relationship model
3. backfill top sports entities
4. add admin validation UI
5. expose entity-aware APIs to search and recommendations

### Dependencies

- confirmation of supported `TopicSchemaType` values
- admin ownership for entity backfill quality
