import { prisma } from "@/lib/db";
import { computeLevelFromPoints, getTierForLevel } from "@/lib/services/gamification.service";

async function main() {
  const batchSize = Number(process.env.BATCH_SIZE ?? 200);
  let processed = 0;
  let cursor: string | null = null;
  for (;;) {
    const users = await prisma.user.findMany({
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
    });
    if (users.length === 0) break;
    for (const u of users) {
      const totalPoints = u.totalPoints ?? 0;
      const { level } = await computeLevelFromPoints(totalPoints);
      const tier = await getTierForLevel(level);
      const latestLevel = await prisma.userLevel.findFirst({ where: { userId: u.id }, orderBy: { reachedAt: "desc" } });
      if (!latestLevel || latestLevel.level !== level) {
        await prisma.userLevel.create({ data: { userId: u.id, level, reachedAt: new Date() } });
      }
      if (tier) {
        const latestTier = await prisma.userTierHistory.findFirst({ where: { userId: u.id }, orderBy: { reachedAt: "desc" } });
        if (!latestTier || latestTier.tierId !== tier.id) {
          await prisma.userTierHistory.create({ data: { userId: u.id, tierId: tier.id, reachedAt: new Date() } });
        }
      }
      processed++;
    }
    cursor = users[users.length - 1].id;
    console.log(`Processed ${processed} users...`);
  }
  console.log(`Done. Processed ${processed} users.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


