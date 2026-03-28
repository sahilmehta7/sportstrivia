-- Add attempt-scoped execution metadata for admin AI tasks
ALTER TABLE "AdminBackgroundTask"
  ADD COLUMN IF NOT EXISTS "attempt" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelledAttempt" INTEGER;

CREATE INDEX IF NOT EXISTS "AdminBackgroundTask_attempt_idx" ON "AdminBackgroundTask"("attempt");
