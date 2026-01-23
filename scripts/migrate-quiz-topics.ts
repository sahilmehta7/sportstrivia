import { PrismaClient } from "@prisma/client";
import { syncTopicsFromQuestionPool } from "../lib/services/quiz-topic-sync.service";
import { determineSportFromTopic } from "../lib/services/ai-quiz-processor.service";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting quiz topic & sport migration...\n");

  // Get all quizzes
  const quizzes = await prisma.quiz.findMany({
    include: {
      topicConfigs: true,
      questionPool: {
        include: {
          question: {
            include: {
              topic: true,
            },
          },
        },
      },
      _count: {
        select: {
          questionPool: true,
        },
      },
    },
  });

  console.log(`Found ${quizzes.length} total quizzes\n`);

  let processed = 0;
  let syncedTopics = 0;
  let syncedSports = 0;
  let skipped = 0;

  for (const quiz of quizzes) {
    let wasUpdated = false;

    // Skip quizzes without questions
    if (quiz.questionPool.length === 0) {
      skipped++;
      continue;
    }

    // 1. Sync topics from question pool
    try {
      const result = await syncTopicsFromQuestionPool(quiz.id);

      if (result.added.length > 0 || result.updated.length > 0 || result.removed.length > 0) {
        wasUpdated = true;
        syncedTopics++;
      }
    } catch (error) {
      console.error(`❌ Error syncing topics for "${quiz.title}":`, error);
    }

    // 2. Backfill sport if missing or "General"
    if (!quiz.sport || quiz.sport.trim() === "" || quiz.sport === "General") {
      try {
        // Count topic occurrences
        const topicCounts = new Map<string, number>();
        for (const poolItem of quiz.questionPool) {
          const name = poolItem.question.topic.name;
          topicCounts.set(name, (topicCounts.get(name) || 0) + 1);
        }

        // Find most common topic
        let mostCommonTopic = "General";
        let maxCount = -1;
        for (const [name, count] of topicCounts.entries()) {
          if (count > maxCount) {
            maxCount = count;
            mostCommonTopic = name;
          }
        }

        const detectedSport = determineSportFromTopic(mostCommonTopic);

        if (detectedSport && detectedSport !== "General") {
          await prisma.quiz.update({
            where: { id: quiz.id },
            data: { sport: detectedSport }
          });
          wasUpdated = true;
          syncedSports++;
          console.log(`🏀 Backfilled sport "${detectedSport}" for "${quiz.title}" (from topic: ${mostCommonTopic})`);
        }
      } catch (error) {
        console.error(`❌ Error backfilling sport for "${quiz.title}":`, error);
      }
    }

    if (wasUpdated) {
      console.log(`✅ Processed: "${quiz.title}"`);
    }

    processed++;
  }

  console.log(`\n✨ Migration complete!`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Synced Topics: ${syncedTopics}`);
  console.log(`   Synced Sports: ${syncedSports}`);
  console.log(`   Skipped (no questions): ${skipped}`);
}

main()
  .catch((e) => {
    console.error("Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
