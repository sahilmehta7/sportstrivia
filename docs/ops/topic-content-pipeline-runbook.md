# Topic Content Pipeline Runbook

## Purpose
Operate, troubleshoot, and recover the topic content ingestion pipeline powering authority sections on topic pages.

## Key routes
- Manual ingest: `POST /api/admin/topics/:id/content/ingest`
- Generate + score: `POST /api/admin/topics/:id/content/generate`
- Publish: `POST /api/admin/topics/:id/content/publish`
- Status: `GET /api/admin/topics/:id/content/status`
- Preview: `GET /api/admin/topics/:id/content/preview`
- Cron refresh: `GET /api/cron/topic-content-refresh` (Bearer `CRON_SECRET`)

## Standard flow
1. Ingest source documents.
2. Generate + score snapshot.
3. Publish READY snapshot.
4. Verify topic page renders authority section.
5. Confirm sitemap includes topic only if index-eligible.

## Common failures and fixes

### 1) Ingest inserts zero docs
- Check `schemaCanonicalUrl` and `schemaSameAs` on topic.
- Ensure source is on allowlist (`wikidata`, `openalex`, `crossref`).
- Confirm blocked sources are expected under strict policy.

### 2) Snapshot rejected by quality gate
- Check selected claim count and source diversity in status response.
- Re-run ingest after enriching topic canonical/sameAs links.
- Re-run generate to produce improved draft.

### 3) Publish fails with “No READY snapshot”
- Run generate + score first.
- Inspect snapshot status via preview/status endpoint.

### 4) Topic remains noindex
- Confirm `topic.indexEligible` true in status.
- Confirm `topic.contentStatus` is `PUBLISHED`.
- Confirm published snapshot exists.

## Safe rollback
If content quality/regression is detected:
1. Set `indexEligible=false` and `contentStatus="DRAFT"` on affected topic.
2. Optionally set current `PUBLISHED` snapshot to `REJECTED`.
3. Keep quiz-discovery page behavior active (fallback path remains).

## Monitoring checklist
- Ingestion success rate
- Average quality score
- Publish rate
- Index-eligible topic count
- Failed run count over last 24h
