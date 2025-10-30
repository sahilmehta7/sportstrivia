const path = require("path");

// Make sure ts-node uses the repo config but transpiles to CommonJS so we can require() exports.
process.env.TS_NODE_PROJECT = path.resolve(__dirname, "..", "tsconfig.json");
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: "commonjs",
  moduleResolution: "node",
});

require("ts-node/register/transpile-only");
require("tsconfig-paths/register");

const { prisma } = require("@/lib/db");
const { computeQuizScale } = require("@/lib/scoring/computeQuizScale");
const { computeQuestionScore } = require("@/lib/scoring/computeQuestionScore");

async function main() {
  const attempts = await prisma.quizAttempt.findMany({
    where: { completedAt: { not: null } },
    include: {
      quiz: true,
      userAnswers: { include: { question: true } },
    },
  });

  let updatedAttempts = 0;

  for (const attempt of attempts) {
    const orderedAnswers = [...attempt.userAnswers].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    const questionConfigs = orderedAnswers.map((ua) => ({
      difficulty: ua.question.difficulty,
      timeLimitSeconds: ua.question.timeLimit ?? attempt.quiz.timePerQuestion ?? 60,
    }));

    const quizScale = computeQuizScale({
      completionBonus: attempt.quiz.completionBonus ?? 0,
      questions: questionConfigs,
    });

    let perQuestionTotal = 0;
    const updates = [];

    for (let index = 0; index < orderedAnswers.length; index += 1) {
      const ua = orderedAnswers[index];
      const config = questionConfigs[index];
      const timeLimit = config.timeLimitSeconds ?? attempt.quiz.timePerQuestion ?? 60;

      const computed = computeQuestionScore({
        isCorrect: ua.isCorrect && !ua.wasSkipped,
        responseTimeSeconds: ua.timeSpent,
        timeLimitSeconds: timeLimit,
        difficulty: ua.question.difficulty,
        quizScale,
      });

      perQuestionTotal += computed;

      updates.push(
        prisma.userAnswer.update({
          where: { id: ua.id },
          data: { basePoints: 0, streakBonus: 0, timeBonus: computed, totalPoints: computed },
        })
      );
    }

    const existingAward = await prisma.quizCompletionBonusAward.findUnique({
      where: { quizId_userId: { quizId: attempt.quizId, userId: attempt.userId } },
      select: { awardedAt: true },
    });

    let awardedThisAttempt = false;
    if (existingAward && attempt.startedAt && attempt.completedAt) {
      awardedThisAttempt =
        existingAward.awardedAt >= attempt.startedAt && existingAward.awardedAt <= attempt.completedAt;
    }

    perQuestionTotal = Math.round(perQuestionTotal);
    const completionPart = awardedThisAttempt ? (attempt.quiz.completionBonus ?? 0) : 0;
    const newTotalPoints = Math.round(perQuestionTotal + completionPart);

    updates.push(
      prisma.quizAttempt.update({
        where: { id: attempt.id },
        data: { totalPoints: newTotalPoints },
      })
    );

    await prisma.$transaction(updates);
    updatedAttempts += 1;
    console.log(
      `[recompute] attempt=${attempt.id} perQuestion=${perQuestionTotal} completion=${completionPart} total=${newTotalPoints}`
    );
  }

  console.log(`Recomputed points for ${updatedAttempts} attempts.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
