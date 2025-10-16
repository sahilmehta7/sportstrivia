import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse, NotFoundError, ForbiddenError, BadRequestError } from "@/lib/errors";

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

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;
    let correctAnswers = 0;

    // Get question pool to get point values
    const questionPool = await prisma.quizQuestionPool.findMany({
      where: {
        quizId: attempt.quizId,
        questionId: { in: attempt.selectedQuestionIds },
      },
    });

    const questionPoints = new Map(
      questionPool.map((qp) => [qp.questionId, qp.points])
    );

    for (const userAnswer of attempt.userAnswers) {
      const points = questionPoints.get(userAnswer.questionId) || 1;
      totalPoints += points;

      if (userAnswer.isCorrect) {
        correctAnswers++;
        earnedPoints += points;

        // Add time bonus if enabled
        if (attempt.quiz.timeBonusEnabled) {
          const questionTimeLimit =
            userAnswer.question.timeLimit || attempt.quiz.timePerQuestion || 60;
          const timeSaved = questionTimeLimit - userAnswer.timeSpent;
          if (timeSaved > 0) {
            earnedPoints += timeSaved * attempt.quiz.bonusPointsPerSecond;
          }
        }
      } else if (
        !userAnswer.wasSkipped &&
        attempt.quiz.negativeMarkingEnabled
      ) {
        // Deduct penalty for wrong answers
        const penalty = points * (attempt.quiz.penaltyPercentage / 100);
        earnedPoints -= penalty;
      }
    }

    // Ensure score is not negative
    earnedPoints = Math.max(0, earnedPoints);

    // Calculate percentage score
    const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = scorePercentage >= attempt.quiz.passingScore;

    // Update attempt
    const completedAttempt = await prisma.quizAttempt.update({
      where: { id },
      data: {
        score: scorePercentage,
        correctAnswers,
        passed,
        completedAt: new Date(),
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
              },
            },
            answer: true,
          },
        },
      },
    });

    // Update user statistics
    await updateUserStatistics(user.id, attempt.quizId, completedAttempt);

    // Update quiz leaderboard if not practice mode
    if (!attempt.isPracticeMode) {
      await updateQuizLeaderboard(
        user.id,
        attempt.quizId,
        scorePercentage,
        Math.floor((new Date().getTime() - attempt.startedAt.getTime()) / 1000)
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
        explanation: ua.question.explanation,
        explanationImageUrl: ua.question.explanationImageUrl,
        explanationVideoUrl: ua.question.explanationVideoUrl,
      })),
    };

    return successResponse(results);
  } catch (error) {
    return handleError(error);
  }
}

// Helper function to update user statistics
async function updateUserStatistics(
  userId: string,
  quizId: string,
  attempt: any
) {
  // Update user streak
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastActive = user.lastActiveDate
      ? new Date(user.lastActiveDate)
      : null;
    
    if (lastActive) {
      lastActive.setHours(0, 0, 0, 0);
    }

    let newStreak = user.currentStreak;

    if (!lastActive || lastActive.getTime() !== today.getTime()) {
      // Check if it's a consecutive day
      if (lastActive) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastActive.getTime() === yesterday.getTime()) {
          newStreak++;
        } else {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(user.longestStreak, newStreak),
          lastActiveDate: new Date(),
        },
      });
    }
  }

  // Fetch all questions in batch
  const questionIds = attempt.userAnswers.map((ua) => ua.questionId);
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
}

// Helper function to update quiz leaderboard
async function updateQuizLeaderboard(
  userId: string,
  quizId: string,
  score: number,
  time: number
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
    // Update if this is a better score
    if (score > existing.bestScore || (score === existing.bestScore && time < existing.bestTime)) {
      await prisma.quizLeaderboard.update({
        where: { id: existing.id },
        data: {
          bestScore: Math.max(score, existing.bestScore),
          bestTime: score > existing.bestScore ? time : Math.min(time, existing.bestTime),
          attempts: { increment: 1 },
        },
      });
    } else {
      await prisma.quizLeaderboard.update({
        where: { id: existing.id },
        data: {
          attempts: { increment: 1 },
        },
      });
    }
  } else {
    await prisma.quizLeaderboard.create({
      data: {
        quizId,
        userId,
        bestScore: score,
        bestTime: time,
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
      orderBy: [{ bestScore: "desc" }, { bestTime: "asc" }],
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

