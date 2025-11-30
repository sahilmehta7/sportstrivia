/*
  Backfill one-time completion bonus awards and update attempts/users.

  Rules:
  - Award once per (user, quiz), on the earliest PASSED, non-practice attempt.
  - Bonus amount = quiz.completionBonus if > 0, otherwise default to 100 × required question count.
    Required question count is (quiz.questionCount || attempt.totalQuestions || attempt.selectedQuestionIds.length).

  Usage:
    set -a; source .env; set +a
    node scripts/backfill-completion-bonus.js
*/

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function deriveDefaultBonus(quiz, attempt) {
  const quizCount = quiz.questionCount || 0;
  const attemptCount = attempt.totalQuestions || (Array.isArray(attempt.selectedQuestionIds) ? attempt.selectedQuestionIds.length : 0) || 0;
  const required = quizCount || attemptCount;
  return required > 0 ? required * 100 : 0;
}

async function main() {
  // Load all passed, non-practice attempts with quiz and user
  const attempts = await prisma.quizAttempt.findMany({
    where: { passed: true, isPracticeMode: false, completedAt: { not: null } },
    include: { quiz: true },
    orderBy: { completedAt: 'asc' },
  });

  // Group by (userId, quizId)
  const groups = new Map();
  for (const a of attempts) {
    const key = `${a.userId}::${a.quizId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(a);
  }

  let created = 0;
  for (const list of groups.values()) {
    const first = list[0]; // earliest passed attempt
    const existing = await prisma.quizCompletionBonusAward.findUnique({
      where: { quizId_userId: { quizId: first.quizId, userId: first.userId } },
    });
    if (existing) continue;

    const effectiveBonus = (first.quiz.completionBonus && first.quiz.completionBonus > 0)
      ? first.quiz.completionBonus
      : deriveDefaultBonus(first.quiz, first);
    if (!effectiveBonus) continue;

    await prisma.$transaction([
      // Ensure quiz has a completionBonus set for consistency (optional but helpful)
      prisma.quiz.update({
        where: { id: first.quizId },
        data: first.quiz.completionBonus && first.quiz.completionBonus > 0 ? {} : { completionBonus: effectiveBonus },
      }),
      prisma.quizCompletionBonusAward.create({ data: { quizId: first.quizId, userId: first.userId, awardedAt: first.completedAt } }),
      prisma.user.update({ where: { id: first.userId }, data: { totalPoints: { increment: effectiveBonus } } }),
      prisma.quizAttempt.update({ where: { id: first.id }, data: { totalPoints: (first.totalPoints || 0) + effectiveBonus } }),
    ]);
    created += 1;
    console.log(`Awarded ${effectiveBonus} to user ${first.userId} for quiz ${first.quizId} at attempt ${first.id}`);
  }

  console.log(`Created ${created} completion bonus awards.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


