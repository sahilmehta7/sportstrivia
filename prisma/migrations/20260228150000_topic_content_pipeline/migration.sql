-- Topic content ingestion pipeline

ALTER TABLE "Topic"
  ADD COLUMN "contentStatus" TEXT NOT NULL DEFAULT 'NONE',
  ADD COLUMN "contentQualityScore" DOUBLE PRECISION,
  ADD COLUMN "contentLastReviewedAt" TIMESTAMP(3),
  ADD COLUMN "indexEligible" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "canonicalSourceSummary" TEXT;

CREATE INDEX "Topic_indexEligible_idx" ON "Topic"("indexEligible");

CREATE TABLE "TopicSourceDocument" (
  "id" TEXT NOT NULL,
  "topicId" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "licenseType" TEXT NOT NULL,
  "isCommercialSafe" BOOLEAN NOT NULL,
  "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rawPayload" JSONB NOT NULL,
  "hash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TopicSourceDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicClaim" (
  "id" TEXT NOT NULL,
  "topicId" TEXT NOT NULL,
  "claimText" TEXT NOT NULL,
  "claimType" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "sourceDocumentId" TEXT NOT NULL,
  "sourceSnippet" TEXT,
  "isContradicted" BOOLEAN NOT NULL DEFAULT false,
  "isSelectedForPublish" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TopicClaim_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicContentSnapshot" (
  "id" TEXT NOT NULL,
  "topicId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "metaDescription" TEXT NOT NULL,
  "introMd" TEXT NOT NULL,
  "keyFactsMd" TEXT NOT NULL,
  "timelineMd" TEXT,
  "analysisMd" TEXT NOT NULL,
  "faqMd" TEXT NOT NULL,
  "sourcesMd" TEXT NOT NULL,
  "wordCount" INTEGER NOT NULL DEFAULT 0,
  "citationCoverage" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "thinRiskScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "lastReviewedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TopicContentSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TopicIngestionRun" (
  "id" TEXT NOT NULL,
  "topicId" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3),
  "endedAt" TIMESTAMP(3),
  "error" TEXT,
  "metrics" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TopicIngestionRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TopicSourceDocument_topicId_idx" ON "TopicSourceDocument"("topicId");
CREATE INDEX "TopicSourceDocument_sourceName_idx" ON "TopicSourceDocument"("sourceName");
CREATE INDEX "TopicSourceDocument_retrievedAt_idx" ON "TopicSourceDocument"("retrievedAt");
CREATE UNIQUE INDEX "TopicSourceDocument_topicId_sourceUrl_hash_key" ON "TopicSourceDocument"("topicId", "sourceUrl", "hash");

CREATE INDEX "TopicClaim_topicId_idx" ON "TopicClaim"("topicId");
CREATE INDEX "TopicClaim_sourceDocumentId_idx" ON "TopicClaim"("sourceDocumentId");
CREATE INDEX "TopicClaim_isSelectedForPublish_idx" ON "TopicClaim"("isSelectedForPublish");

CREATE INDEX "TopicContentSnapshot_topicId_status_idx" ON "TopicContentSnapshot"("topicId", "status");
CREATE UNIQUE INDEX "TopicContentSnapshot_topicId_version_key" ON "TopicContentSnapshot"("topicId", "version");

CREATE INDEX "TopicIngestionRun_topicId_status_idx" ON "TopicIngestionRun"("topicId", "status");
CREATE INDEX "TopicIngestionRun_startedAt_idx" ON "TopicIngestionRun"("startedAt");

ALTER TABLE "TopicSourceDocument" ADD CONSTRAINT "TopicSourceDocument_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TopicClaim" ADD CONSTRAINT "TopicClaim_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TopicClaim" ADD CONSTRAINT "TopicClaim_sourceDocumentId_fkey"
  FOREIGN KEY ("sourceDocumentId") REFERENCES "TopicSourceDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TopicContentSnapshot" ADD CONSTRAINT "TopicContentSnapshot_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TopicIngestionRun" ADD CONSTRAINT "TopicIngestionRun_topicId_fkey"
  FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
