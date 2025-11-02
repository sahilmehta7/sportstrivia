-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "completionBonus" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "QuizCompletionBonusAward" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizCompletionBonusAward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizCompletionBonusAward_quizId_idx" ON "QuizCompletionBonusAward"("quizId");

-- CreateIndex
CREATE INDEX "QuizCompletionBonusAward_userId_idx" ON "QuizCompletionBonusAward"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "QuizCompletionBonusAward_quizId_userId_key" ON "QuizCompletionBonusAward"("quizId", "userId");

-- AddForeignKey
ALTER TABLE "QuizCompletionBonusAward" ADD CONSTRAINT "QuizCompletionBonusAward_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizCompletionBonusAward" ADD CONSTRAINT "QuizCompletionBonusAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Create enum NotificationDigestFrequency
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationDigestFrequency') THEN
        CREATE TYPE "NotificationDigestFrequency" AS ENUM ('OFF', 'DAILY', 'WEEKLY');
    END IF;
END $$;

-- Create PushSubscription table
CREATE TABLE IF NOT EXISTS "PushSubscription" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "keysP256dh" TEXT NOT NULL,
    "keysAuth" TEXT NOT NULL,
    "expirationTime" TIMESTAMP(3),
    "userAgent" TEXT,
    "deviceType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- Create UserNotificationPreference table
CREATE TABLE IF NOT EXISTS "UserNotificationPreference" (
    "userId" TEXT PRIMARY KEY,
    "digestFrequency" "NotificationDigestFrequency" NOT NULL DEFAULT 'OFF',
    "digestTimeOfDay" INTEGER NOT NULL DEFAULT 9,
    "digestTimeZone" TEXT,
    "lastDigestAt" TIMESTAMP(3),
    "emailOptIn" BOOLEAN NOT NULL DEFAULT true,
    "pushOptIn" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserNotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
