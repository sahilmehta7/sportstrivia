# Topic Content Ingestion + SEO/AEO Enrichment Plan (Implemented)

## Summary
This repository now includes a commercial-safe, source-grounded topic content pipeline to enrich `/topics/[slug]` pages with factual content and citations, while quality-gating indexability to reduce thin-page risk.

Chosen defaults:
- Licensing: strict commercial-safe allowlist
- Indexing: quality-gated

## Implemented Scope

### Data model
- Added topic content pipeline models in `prisma/schema.prisma`:
  - `TopicSourceDocument`
  - `TopicClaim`
  - `TopicContentSnapshot`
  - `TopicIngestionRun`
- Added `Topic` fields:
  - `contentStatus`
  - `contentQualityScore`
  - `contentLastReviewedAt`
  - `indexEligible`
  - `canonicalSourceSummary`

### Source policy
- Added `lib/content/source-policy.ts` with strict allowlist:
  - Allowed commercial-safe: `wikidata`, `openalex`, `crossref`
  - Conditional: `wikipedia` (not commercial-safe in strict mode)
  - Others blocked

### Pipeline services
- Added service set under `lib/services/topic-content/`:
  - `collect.service.ts`
  - `normalize.service.ts`
  - `verify.service.ts`
  - `generate.service.ts`
  - `score.service.ts`
  - `publish.service.ts`
  - `pipeline.service.ts`
  - `run.service.ts`
  - `types.ts`

### Jobs + cron
- Added job: `lib/jobs/topic-content-refresh.job.ts`
- Added cron route: `app/api/cron/topic-content-refresh/route.ts`

### Admin API routes
- Added:
  - `POST /api/admin/topics/[id]/content/ingest`
  - `GET /api/admin/topics/[id]/content/status`
  - `POST /api/admin/topics/[id]/content/generate`
  - `POST /api/admin/topics/[id]/content/publish`
  - `GET /api/admin/topics/[id]/content/preview`

### Topic page integration
- Added `components/topics/topic-authority-section.tsx`
- Integrated authority block into `app/topics/[slug]/page.tsx` when:
  - `topic.contentStatus === "PUBLISHED"`
  - `topic.indexEligible === true`
  - published snapshot exists
- Metadata now prefers published snapshot title/meta description and applies `noindex,follow` when topic is not index-eligible.
- Added FAQ JSON-LD emission from snapshot FAQ content.

### Sitemap integration
- `app/sitemap.ts` now includes only `Topic` rows where `indexEligible = true`.

### Admin UI integration
- Extended `app/admin/topics/[id]/edit/page.tsx` with a new **Content Pipeline** card:
  - Run Ingest
  - Generate Draft
  - Publish Snapshot
  - Status, quality score, index eligibility, snapshot metrics

## Quality Gate (current defaults)
Configured in `lib/services/topic-content/types.ts`:
- `wordCount >= 900`
- `selectedClaims >= 8`
- `distinctSources >= 3`
- `citationCoverage >= 0.85`
- `qualityScore >= 75`

## Notes
- Generation includes robust fallback behavior if model calls fail, so pipeline can still create draft snapshots.
- The ingest stage currently derives source document candidates from topic canonical/sameAs links and adds deterministic fallback source entries.
- This implementation is designed to be extended with richer source adapters without changing API/UI contracts.
