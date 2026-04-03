-- Backfill follows into interests before dropping follow storage
INSERT INTO "UserInterestPreference" ("id", "userId", "topicId", "source", "strength", "createdAt", "updatedAt")
SELECT
  concat('migrated_', md5(random()::text || clock_timestamp()::text || f."userId" || f."topicId")),
  f."userId",
  f."topicId",
  'PROFILE'::"InterestPreferenceSource",
  1,
  now(),
  now()
FROM "UserFollowedTopic" f
LEFT JOIN "UserInterestPreference" i
  ON i."userId" = f."userId" AND i."topicId" = f."topicId"
WHERE i."id" IS NULL;

DROP TABLE IF EXISTS "UserFollowedTopic";
