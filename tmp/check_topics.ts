// @ts-ignore
import { prisma } from "../lib/db";

async function checkTopics() {
  const topics = await prisma.topic.findMany({
    where: {
      contentStatus: "PUBLISHED"
    },
    take: 5,
    include: {
      contentSnapshots: {
        where: { status: "PUBLISHED" },
        orderBy: { version: "desc" }
      }
    }
  });

  console.log(JSON.stringify(topics, null, 2));
}

checkTopics()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
