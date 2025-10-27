import { prisma } from "@/lib/db";
import { Difficulty } from "@prisma/client";

/**
 * Sync topic configs for a quiz based on its question pool
 * This extracts unique topics from the questions and creates/updates QuizTopicConfig entries
 * This is useful for FIXED mode quizzes where questions are explicitly added to the pool
 */
export async function syncTopicsFromQuestionPool(quizId: string) {
  // Get quiz with question pool
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questionPool: {
        include: {
          question: {
            include: {
              topic: true,
            },
          },
        },
      },
      topicConfigs: true,
    },
  });

  if (!quiz) {
    throw new Error("Quiz not found");
  }

  if (quiz.questionPool.length === 0) {
    // No questions, remove all topic configs
    await prisma.quizTopicConfig.deleteMany({
      where: { quizId },
    });
    return { added: [], removed: [] };
  }

  // Count questions by topic and difficulty
  const topicDifficultyCounts = new Map<
    string,
    Map<Difficulty, number>
  >();

  for (const poolItem of quiz.questionPool) {
    const topicId = poolItem.question.topic.id;
    const difficulty = poolItem.question.difficulty;

    if (!topicDifficultyCounts.has(topicId)) {
      topicDifficultyCounts.set(topicId, new Map());
    }

    const difficultyMap = topicDifficultyCounts.get(topicId)!;
    difficultyMap.set(
      difficulty,
      (difficultyMap.get(difficulty) || 0) + 1
    );
  }

  // Get all existing configs
  const existingConfigs = quiz.topicConfigs;

  // Create/update configs for each topic-difficulty combination
  const added: string[] = [];
  const updated: string[] = [];

  for (const [topicId, difficultyMap] of topicDifficultyCounts.entries()) {
    for (const [difficulty, questionCount] of difficultyMap.entries()) {
      // Check if config already exists
      const existing = existingConfigs.find(
        (config) => config.topicId === topicId && config.difficulty === difficulty
      );

      if (existing) {
        // Update question count if it has changed
        if (existing.questionCount !== questionCount) {
          await prisma.quizTopicConfig.update({
            where: { id: existing.id },
            data: { questionCount },
          });
          updated.push(existing.id);
        }
      } else {
        // Create new config
        const newConfig = await prisma.quizTopicConfig.create({
          data: {
            quizId,
            topicId,
            difficulty,
            questionCount,
          },
        });
        added.push(newConfig.id);
      }
    }
  }

  // Remove configs that no longer exist
  const removed: string[] = [];

  for (const config of existingConfigs) {
    const exists = Array.from(topicDifficultyCounts.keys()).includes(config.topicId) &&
                   topicDifficultyCounts.get(config.topicId)?.has(config.difficulty);

    if (!exists) {
      await prisma.quizTopicConfig.delete({
        where: { id: config.id },
      });
      removed.push(config.id);
    }
  }

  return { added, updated, removed };
}
