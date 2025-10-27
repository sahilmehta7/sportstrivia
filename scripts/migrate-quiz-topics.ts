import { PrismaClient } from "@prisma/client";
import { syncTopicsFromQuestionPool } from "../lib/services/quiz-topic-sync.service";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting quiz topic migration...\n");

  // Get all quizzes that have questions but no topic configs
  const quizzes = await prisma.quiz.findMany({
    include: {
      topicConfigs: true,
      questionPool: true,
      _count: {
        select: {
          questionPool: true,
        },
      },
    },
  });

  console.log(`Found ${quizzes.length} total quizzes\n`);

  let processed = 0;
  let synced = 0;
  let skipped = 0;

  for (const quiz of quizzes) {
    // Skip quizzes without questions
    if (quiz.questionPool.length === 0) {
      skipped++;
      continue;
    }

    // Sync topics from question pool
    try {
      const result = await syncTopicsFromQuestionPool(quiz.id);
      
      if (result.added.length > 0 || result.updated.length > 0 || result.removed.length > 0) {
        console.log(`✅ Synced: "${quiz.title}"`);
        console.log(`   Added: ${result.added.length}, Updated: ${result.updated.length}, Removed: ${result.removed.length}`);
        synced++;
      }
    } catch (error) {
      console.error(`❌ Error syncing "${quiz.title}":`, error);
    }

    processed++;
  }

  console.log(`\n✨ Migration complete!`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Synced: ${synced}`);
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
