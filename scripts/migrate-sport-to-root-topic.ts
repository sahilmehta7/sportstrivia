/*
  Usage:
  - Build:   npm run build
  - Run:     node .next/standalone/scripts/migrate-sport-to-root-topic.js   (if using standalone)
     or      ts-node scripts/migrate-sport-to-root-topic.ts                 (if ts-node available locally)

  Description:
  - Normalizes existing Quiz.sport free-text values to canonical Level 0 Topic names.
  - For each distinct sport value, finds (case-insensitive) or creates a root Topic.
  - Updates quizzes to use the canonical topic name in quiz.sport.
*/

// Use require with CommonJS resolution to avoid ESM path issues when running with node -e
const { prisma } = require("../lib/db");
const { generateUniqueSlug } = require("../lib/services/slug.service");

async function main() {
  const distinctSports = await prisma.quiz.findMany({
    where: {
      sport: {
        not: null,
      },
    },
    select: { sport: true },
    distinct: ["sport"],
  });

  const sports = distinctSports
    .map((r: { sport: string | null }) => (r.sport || "").trim())
    .filter((s: string) => s.length > 0);

  console.log(`Found ${sports.length} distinct sport values to normalize...`);

  for (const sportName of sports) {
    try {
      const existingRoot = await prisma.topic.findFirst({
        where: { parentId: null, name: { equals: sportName, mode: "insensitive" } },
        select: { id: true, name: true },
      });

      let canonicalName = existingRoot?.name;

      if (!canonicalName) {
        const created = await prisma.topic.create({
          data: {
            name: sportName,
            slug: await generateUniqueSlug(sportName, "topic"),
            level: 0,
          },
          select: { name: true },
        });
        canonicalName = created.name;
        console.log(`Created root topic for sport: "${sportName}" -> "${canonicalName}"`);
      } else {
        console.log(`Using existing root topic for sport: "${sportName}" -> "${canonicalName}"`);
      }

      await prisma.quiz.updateMany({
        where: { sport: { equals: sportName, mode: "insensitive" } },
        data: { sport: canonicalName },
      });

      console.log(`Updated quizzes with sport "${sportName}" to canonical "${canonicalName}"`);
    } catch (error) {
      console.error(`Failed to normalize sport: ${sportName}`, error);
    }
  }

  console.log("Migration complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


