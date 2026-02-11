-- Remove duplicate answers per (attemptId, questionId), keeping one row per pair.
DELETE FROM "UserAnswer" ua
USING "UserAnswer" dup
WHERE ua."attemptId" = dup."attemptId"
  AND ua."questionId" = dup."questionId"
  AND ua."id" > dup."id";

-- Enforce one submitted answer per question per attempt.
CREATE UNIQUE INDEX IF NOT EXISTS "UserAnswer_attemptId_questionId_key"
ON "UserAnswer"("attemptId", "questionId");
