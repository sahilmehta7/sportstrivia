/*
  Migration: Normalize Quiz.sport to canonical Level 0 Topic names

  Run:
    node scripts/migrate-sport-to-root-topic.js
*/

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function slugify(input) {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function generateUniqueTopicSlug(base) {
  const baseSlug = slugify(base) || 'topic';
  let candidate = baseSlug;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await prisma.topic.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    candidate = `${baseSlug}-${suffix++}`;
  }
}

async function main() {
  const distinct = await prisma.quiz.findMany({
    where: { sport: { not: null } },
    select: { sport: true },
    distinct: ['sport'],
  });

  const sports = distinct
    .map((r) => (r.sport || '').trim())
    .filter((s) => s.length > 0);

  console.log(`Found ${sports.length} distinct sport values...`);

  for (const sportName of sports) {
    try {
      const existingRoot = await prisma.topic.findFirst({
        where: { parentId: null, name: { equals: sportName, mode: 'insensitive' } },
        select: { id: true, name: true },
      });

      let canonicalName = existingRoot?.name;
      if (!canonicalName) {
        const slug = await generateUniqueTopicSlug(sportName);
        const created = await prisma.topic.create({
          data: { name: sportName, slug, level: 0 },
          select: { name: true },
        });
        canonicalName = created.name;
        console.log(`Created root topic for sport: "${sportName}" -> "${canonicalName}"`);
      } else {
        console.log(`Using existing root topic for sport: "${sportName}" -> "${canonicalName}"`);
      }

      const result = await prisma.quiz.updateMany({
        where: { sport: { equals: sportName, mode: 'insensitive' } },
        data: { sport: canonicalName },
      });
      console.log(`Updated ${result.count} quizzes for sport "${sportName}"`);
    } catch (e) {
      console.error(`Error processing sport "${sportName}":`, e.message || e);
    }
  }

  console.log('Migration complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


