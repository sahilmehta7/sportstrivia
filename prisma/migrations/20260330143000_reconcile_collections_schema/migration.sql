-- Reconcile collections schema for environments where migrations were baselined
-- without executing the original collections DDL.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'CollectionStatus'
  ) THEN
    CREATE TYPE "CollectionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'CollectionType'
  ) THEN
    CREATE TYPE "CollectionType" AS ENUM (
      'EDITORIAL',
      'EVENT',
      'TEAM',
      'TOURNAMENT',
      'DIFFICULTY',
      'FORMAT',
      'AUTO_GENERATED'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Collection" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "coverImageUrl" TEXT,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "status" "CollectionStatus" NOT NULL DEFAULT 'DRAFT',
  "type" "CollectionType" NOT NULL DEFAULT 'EDITORIAL',
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "primaryTopicId" TEXT,
  "rulesJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CollectionQuiz" (
  "id" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "quizId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CollectionQuiz_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UserCollectionProgress" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "lastQuizId" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastPlayedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedQuizCount" INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserCollectionProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Collection_slug_key" ON "Collection"("slug");
CREATE INDEX IF NOT EXISTS "Collection_status_isFeatured_idx" ON "Collection"("status", "isFeatured");
CREATE INDEX IF NOT EXISTS "Collection_type_status_idx" ON "Collection"("type", "status");
CREATE INDEX IF NOT EXISTS "Collection_primaryTopicId_status_idx" ON "Collection"("primaryTopicId", "status");

CREATE UNIQUE INDEX IF NOT EXISTS "CollectionQuiz_collectionId_quizId_key" ON "CollectionQuiz"("collectionId", "quizId");
CREATE UNIQUE INDEX IF NOT EXISTS "CollectionQuiz_collectionId_order_key" ON "CollectionQuiz"("collectionId", "order");
CREATE INDEX IF NOT EXISTS "CollectionQuiz_quizId_idx" ON "CollectionQuiz"("quizId");

CREATE UNIQUE INDEX IF NOT EXISTS "UserCollectionProgress_userId_collectionId_key"
ON "UserCollectionProgress"("userId", "collectionId");
CREATE INDEX IF NOT EXISTS "UserCollectionProgress_userId_lastPlayedAt_idx"
ON "UserCollectionProgress"("userId", "lastPlayedAt");
CREATE INDEX IF NOT EXISTS "UserCollectionProgress_collectionId_completedAt_idx"
ON "UserCollectionProgress"("collectionId", "completedAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Collection_primaryTopicId_fkey'
  ) THEN
    ALTER TABLE "Collection"
      ADD CONSTRAINT "Collection_primaryTopicId_fkey"
      FOREIGN KEY ("primaryTopicId") REFERENCES "Topic"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CollectionQuiz_collectionId_fkey'
  ) THEN
    ALTER TABLE "CollectionQuiz"
      ADD CONSTRAINT "CollectionQuiz_collectionId_fkey"
      FOREIGN KEY ("collectionId") REFERENCES "Collection"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'CollectionQuiz_quizId_fkey'
  ) THEN
    ALTER TABLE "CollectionQuiz"
      ADD CONSTRAINT "CollectionQuiz_quizId_fkey"
      FOREIGN KEY ("quizId") REFERENCES "Quiz"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserCollectionProgress_userId_fkey'
  ) THEN
    ALTER TABLE "UserCollectionProgress"
      ADD CONSTRAINT "UserCollectionProgress_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserCollectionProgress_collectionId_fkey'
  ) THEN
    ALTER TABLE "UserCollectionProgress"
      ADD CONSTRAINT "UserCollectionProgress_collectionId_fkey"
      FOREIGN KEY ("collectionId") REFERENCES "Collection"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserCollectionProgress_lastQuizId_fkey'
  ) THEN
    ALTER TABLE "UserCollectionProgress"
      ADD CONSTRAINT "UserCollectionProgress_lastQuizId_fkey"
      FOREIGN KEY ("lastQuizId") REFERENCES "Quiz"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
