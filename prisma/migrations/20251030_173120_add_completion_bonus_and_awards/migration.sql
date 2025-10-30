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

