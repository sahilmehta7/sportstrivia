import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, ForbiddenError, BadRequestError } from "@/lib/errors";
import { applyProgression, type TierProgress } from "@/lib/services/progression.service";
import type { Prisma } from "@prisma/client";
import { checkAndAwardBadges } from "@/lib/services/badge.service";

// POST /api/attempts/[id]/complete - Complete quiz attempt and calculate score
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Get attempt with answers
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id },
      include: {
        quiz: true,
        userAnswers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundError("Quiz attempt not found");
    }

    // Verify ownership
    if (attempt.userId !== user.id) {
      throw new ForbiddenError("You do not have permission to complete this quiz attempt");
    }

    // Check if already completed
    if (attempt.completedAt) {
      throw new BadRequestError("Quiz attempt already completed");
    }

    const orderedAnswers = [...attempt.userAnswers].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    const questionPool = await prisma.quizQuestionPool.findMany({
      where: {
        quizId: attempt.quizId,
        questionId: { in: attempt.selectedQuestionIds },
      },
      select: {
        questionId: true,
        points: true,
      },
    });

    const questionPoints = new Map<string, number>(
      questionPool.map((qp) => [qp.questionId, qp.points])
    );

    const defaultBasePoints = 100;
    const streakBonusIncrement = 10;

    let totalPoints = 0;
    let totalTimeSpent = 0;
    let correctAnswers = 0;
    let currentStreak = 0;
    let longestStreak = 0;

    const answerScoreData: {
      id: string;
      basePoints: number;
      timeBonus: number;
      streakBonus: number;
      totalPoints: number;
    }[] = [];

    for (const userAnswer of orderedAnswers) {
      const questionBasePoints = questionPoints.get(userAnswer.questionId) ?? defaultBasePoints;
      const questionTimeLimit =
        userAnswer.question.timeLimit ?? attempt.quiz.timePerQuestion ?? 60;

      totalTimeSpent += userAnswer.timeSpent;

      let basePoints = 0;
      let timeBonus = 0;
      let streakBonus = 0;
      let totalForQuestion = 0;

      if (userAnswer.isCorrect && !userAnswer.wasSkipped) {
        basePoints = questionBasePoints;

        if (attempt.quiz.timeBonusEnabled && attempt.quiz.bonusPointsPerSecond > 0) {
          const timeSaved = Math.max(0, questionTimeLimit - userAnswer.timeSpent);
          timeBonus = Math.max(
            0,
            Math.ceil(timeSaved * attempt.quiz.bonusPointsPerSecond)
          );
        }

        currentStreak += 1;
        if (currentStreak > 1) {
          streakBonus = (currentStreak - 1) * streakBonusIncrement;
        }
        longestStreak = Math.max(longestStreak, currentStreak);

        totalForQuestion = basePoints + timeBonus + streakBonus;
        correctAnswers += 1;
      } else {
        currentStreak = 0;
      }

      totalPoints += totalForQuestion;

      answerScoreData.push({
        id: userAnswer.id,
        basePoints,
        timeBonus,
        streakBonus,
        totalPoints: totalForQuestion,
      });
    }

    const answeredCount = orderedAnswers.length;
    const averageResponseTime =
      answeredCount > 0 ? totalTimeSpent / answeredCount : 0;

    const totalQuestions = attempt.totalQuestions || answeredCount;
    const scorePercentage =
      totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const passed = scorePercentage >= attempt.quiz.passingScore;

    const completedAttempt = await prisma.$transaction(async (tx) => {
      for (const answer of answerScoreData) {
        await tx.userAnswer.update({
          where: { id: answer.id },
          data: {
            basePoints: answer.basePoints,
            timeBonus: answer.timeBonus,
            streakBonus: answer.streakBonus,
            totalPoints: answer.totalPoints,
          },
        });
      }

      return tx.quizAttempt.update({
        where: { id },
        data: {
          score: scorePercentage,
          correctAnswers,
          passed,
          completedAt: new Date(),
          totalPoints,
          longestStreak,
          averageResponseTime,
          totalTimeSpent,
        },
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              slug: true,
              passingScore: true,
            },
          },
          userAnswers: {
            include: {
              question: {
                select: {
                  id: true,
                  questionText: true,
                  explanation: true,
                  explanationImageUrl: true,
                  explanationVideoUrl: true,
                  timeLimit: true,
                },
              },
              answer: true,
            },
          },
        },
      });
    });

    // Update user statistics
    const progression = await updateUserStatistics(
      user.id,
      attempt.quizId,
      completedAttempt,
      totalPoints
    );

    // Update quiz leaderboard if not practice mode
    if (!attempt.isPracticeMode) {
      const totalElapsedSeconds = Math.floor(
        (new Date().getTime() - attempt.startedAt.getTime()) / 1000
      );

      await updateQuizLeaderboard(
        user.id,
        attempt.quizId,
        scorePercentage,
        totalPoints,
        averageResponseTime,
        totalElapsedSeconds
      );
    }

    // Get correct answers for review in batch
    const questionIds = completedAttempt.userAnswers.map((ua) => ua.questionId);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: {
        answers: {
          where: { isCorrect: true },
        },
      },
    });

    const correctAnswersMap = new Map(
      questions.map((q) => [q.id, q.answers[0]])
    );

    // Prepare results
    const results = {
      attempt: {
        id: completedAttempt.id,
        quizId: completedAttempt.quizId,
        score: completedAttempt.score,
        totalQuestions: completedAttempt.totalQuestions,
        correctAnswers: completedAttempt.correctAnswers,
        passed: completedAttempt.passed,
        totalPoints: completedAttempt.totalPoints,
        longestStreak: completedAttempt.longestStreak,
        averageResponseTime: completedAttempt.averageResponseTime,
        totalTimeSpent: completedAttempt.totalTimeSpent,
        startedAt: completedAttempt.startedAt,
        completedAt: completedAttempt.completedAt,
        isPracticeMode: completedAttempt.isPracticeMode,
      },
      quiz: completedAttempt.quiz,
      answers: completedAttempt.userAnswers.map((ua) => ({
        questionId: ua.questionId,
        questionText: ua.question.questionText,
        userAnswerId: ua.answerId,
        correctAnswerId: correctAnswersMap.get(ua.questionId)?.id,
        isCorrect: ua.isCorrect,
        wasSkipped: ua.wasSkipped,
        timeSpent: ua.timeSpent,
        basePoints: ua.basePoints,
        timeBonus: ua.timeBonus,
        streakBonus: ua.streakBonus,
        totalPoints: ua.totalPoints,
        timeLimit: ua.question.timeLimit ?? attempt.quiz.timePerQuestion ?? 60,
        explanation: ua.question.explanation,
        explanationImageUrl: ua.question.explanationImageUrl,
        explanationVideoUrl: ua.question.explanationVideoUrl,
      })),
    };

    // Check and award badges
    const awardedBadges = await checkAndAwardBadges(user.id);

    return successResponse({
      ...results,
      awardedBadges,
      progression,
    });
  } catch (error) {
    return handleError(error);
  }
}

// Helper function to update user statistics
async function updateUserStatistics(
  userId: string,
  quizId: string,
  attempt: any,
  pointsEarned: number
): Promise<TierProgress> {
  // Update user streak
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      lastActiveDate: true,
      totalPoints: true,
      experienceTier: true,
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActive = user?.lastActiveDate ? new Date(user.lastActiveDate) : null;
  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
  }

  let newStreak = user?.currentStreak ?? 0;
  let newLongestStreak = user?.longestStreak ?? 0;

  if (!lastActive || lastActive.getTime() !== today.getTime()) {
    if (lastActive) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastActive.getTime() === yesterday.getTime()) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }
  }

  newLongestStreak = Math.max(newLongestStreak, newStreak);

  const userUpdateOverrides: Prisma.UserUpdateInput = {
    currentStreak: newStreak,
    longestStreak: newLongestStreak,
    lastActiveDate: new Date(),
  };

  // Fetch all questions in batch
  const questionIds = attempt.userAnswers.map((ua: { questionId: string }) => ua.questionId);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, topicId: true },
  });

  const questionMap = new Map(questions.map((q) => [q.id, q.topicId]));
  
  // Group answers by topic for batch processing
  const topicAnswerMap = new Map<string, { correct: number; total: number; totalTime: number }>();
  
  for (const userAnswer of attempt.userAnswers) {
    const topicId = questionMap.get(userAnswer.questionId);
    if (!topicId) continue;
    
    const stats = topicAnswerMap.get(topicId) || { correct: 0, total: 0, totalTime: 0 };
    stats.total++;
    if (userAnswer.isCorrect) stats.correct++;
    stats.totalTime += userAnswer.timeSpent;
    topicAnswerMap.set(topicId, stats);
  }

  // Fetch existing topic stats in batch
  const topicIds = Array.from(topicAnswerMap.keys());
  const existingTopicStats = await prisma.userTopicStats.findMany({
    where: {
      userId,
      topicId: { in: topicIds },
    },
  });

  const existingStatsMap = new Map(existingTopicStats.map((s) => [s.topicId, s]));

  // Prepare batch updates and creates
  const updates = [];
  const creates = [];

  for (const [topicId, stats] of topicAnswerMap.entries()) {
    const existing = existingStatsMap.get(topicId);
    
    if (existing) {
      const newQuestionsAnswered = existing.questionsAnswered + stats.total;
      const newQuestionsCorrect = existing.questionsCorrect + stats.correct;
      const newSuccessRate = (newQuestionsCorrect / newQuestionsAnswered) * 100;
      const newAverageTime =
        (existing.averageTime * existing.questionsAnswered + stats.totalTime) /
        newQuestionsAnswered;

      updates.push(
        prisma.userTopicStats.update({
          where: { id: existing.id },
          data: {
            questionsAnswered: newQuestionsAnswered,
            questionsCorrect: newQuestionsCorrect,
            successRate: newSuccessRate,
            averageTime: newAverageTime,
            lastAnsweredAt: new Date(),
          },
        })
      );
    } else {
      creates.push(
        prisma.userTopicStats.create({
          data: {
            userId,
            topicId,
            questionsAnswered: stats.total,
            questionsCorrect: stats.correct,
            successRate: (stats.correct / stats.total) * 100,
            averageTime: stats.totalTime / stats.total,
            lastAnsweredAt: new Date(),
          },
        })
      );
    }
  }

  // Execute all updates and creates in parallel
  await Promise.all([...updates, ...creates]);

  const progression = await applyProgression(
    userId,
    pointsEarned,
    userUpdateOverrides,
    user
      ? {
          totalPoints: user.totalPoints ?? 0,
          experienceTier: user.experienceTier,
        }
      : undefined
  );

  return progression;
}

// Helper function to update quiz leaderboard
async function updateQuizLeaderboard(
  userId: string,
  quizId: string,
  score: number,
  points: number,
  averageResponseTime: number,
  totalTime: number
) {
  const existing = await prisma.quizLeaderboard.findUnique({
    where: {
      quizId_userId: {
        quizId,
        userId,
      },
    },
  });

  if (existing) {
    const isBetterAttempt =
      points > existing.bestPoints ||
      (points === existing.bestPoints &&
        (existing.averageResponseTime === 0 || averageResponseTime < existing.averageResponseTime));

    await prisma.quizLeaderboard.update({
      where: { id: existing.id },
      data: {
        bestScore: Math.max(score, existing.bestScore),
        bestTime: existing.bestTime === 0 ? totalTime : Math.min(totalTime, existing.bestTime),
        bestPoints: isBetterAttempt ? points : Math.max(points, existing.bestPoints),
        averageResponseTime: isBetterAttempt
          ? averageResponseTime
          : existing.averageResponseTime || averageResponseTime,
        attempts: { increment: 1 },
      },
    });
  } else {
    await prisma.quizLeaderboard.create({
      data: {
        quizId,
        userId,
        bestScore: score,
        bestTime: totalTime,
        bestPoints: points,
        averageResponseTime,
        attempts: 1,
      },
    });
  }

  // Update rankings - must handle unique constraint on [quizId, rank]
  // Strategy: First reset all ranks to placeholder values, then assign correct ranks
  await prisma.$transaction(async (tx) => {
    // Step 1: Reset all ranks to temporary values to avoid constraint conflicts
    await tx.quizLeaderboard.updateMany({
      where: { quizId },
      data: { rank: 999999 },
    });

    // Step 2: Fetch sorted leaderboard and assign correct ranks
    const leaderboard = await tx.quizLeaderboard.findMany({
      where: { quizId },
      orderBy: [
        { bestPoints: "desc" },
        { averageResponseTime: "asc" },
        { bestScore: "desc" },
      ],
      select: { id: true },
    });

    // Step 3: Update each entry with its correct rank
    for (let i = 0; i < leaderboard.length; i++) {
      await tx.quizLeaderboard.update({
        where: { id: leaderboard[i].id },
        data: { rank: i + 1 },
      });
    }
  });
}
