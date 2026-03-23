-- CreateEnum
CREATE TYPE "TopicEntityStatus" AS ENUM ('DRAFT', 'READY', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "TopicRelationType" AS ENUM ('BELONGS_TO_SPORT', 'PLAYS_FOR', 'REPRESENTS', 'COMPETES_IN', 'ORGANIZED_BY', 'RIVAL_OF', 'RELATED_TO');

-- CreateEnum
CREATE TYPE "InterestPreferenceSource" AS ENUM ('ONBOARDING', 'PROFILE', 'ADMIN', 'IMPORT');

-- AlterTable
ALTER TABLE "Topic" ADD COLUMN     "alternateNames" TEXT[],
ADD COLUMN     "entityStatus" "TopicEntityStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "entityValidatedAt" TIMESTAMP(3);

UPDATE "Topic"
SET "alternateNames" = ARRAY[]::TEXT[]
WHERE "alternateNames" IS NULL;

ALTER TABLE "Topic"
ALTER COLUMN "alternateNames" SET DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "alternateNames" SET NOT NULL;

-- CreateTable
CREATE TABLE "TopicRelation" (
    "id" TEXT NOT NULL,
    "fromTopicId" TEXT NOT NULL,
    "toTopicId" TEXT NOT NULL,
    "relationType" "TopicRelationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopicRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInterestPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "source" "InterestPreferenceSource" NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInterestPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFollowedTopic" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFollowedTopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDiscoveryPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "preferredDifficulty" "Difficulty",
    "preferredPlayModes" "PlayMode"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDiscoveryPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TopicRelation_fromTopicId_relationType_idx" ON "TopicRelation"("fromTopicId", "relationType");

-- CreateIndex
CREATE INDEX "TopicRelation_toTopicId_relationType_idx" ON "TopicRelation"("toTopicId", "relationType");

-- CreateIndex
CREATE UNIQUE INDEX "TopicRelation_fromTopicId_toTopicId_relationType_key" ON "TopicRelation"("fromTopicId", "toTopicId", "relationType");

-- CreateIndex
CREATE INDEX "UserInterestPreference_userId_idx" ON "UserInterestPreference"("userId");

-- CreateIndex
CREATE INDEX "UserInterestPreference_topicId_idx" ON "UserInterestPreference"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "UserInterestPreference_userId_topicId_key" ON "UserInterestPreference"("userId", "topicId");

-- CreateIndex
CREATE INDEX "UserFollowedTopic_userId_idx" ON "UserFollowedTopic"("userId");

-- CreateIndex
CREATE INDEX "UserFollowedTopic_topicId_idx" ON "UserFollowedTopic"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFollowedTopic_userId_topicId_key" ON "UserFollowedTopic"("userId", "topicId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDiscoveryPreference_userId_key" ON "UserDiscoveryPreference"("userId");

-- AddForeignKey
ALTER TABLE "TopicRelation" ADD CONSTRAINT "TopicRelation_fromTopicId_fkey" FOREIGN KEY ("fromTopicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopicRelation" ADD CONSTRAINT "TopicRelation_toTopicId_fkey" FOREIGN KEY ("toTopicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterestPreference" ADD CONSTRAINT "UserInterestPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterestPreference" ADD CONSTRAINT "UserInterestPreference_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollowedTopic" ADD CONSTRAINT "UserFollowedTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFollowedTopic" ADD CONSTRAINT "UserFollowedTopic_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDiscoveryPreference" ADD CONSTRAINT "UserDiscoveryPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
