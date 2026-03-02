import { prisma } from "@/lib/db";
import { ConflictError, NotFoundError } from "@/lib/errors";

export async function publishTopicContentSnapshot(topicId: string) {
  const [topic, readySnapshot, latestSnapshot] = await Promise.all([
    prisma.topic.findUnique({
      where: { id: topicId },
      select: { id: true, name: true },
    }),
    prisma.topicContentSnapshot.findFirst({
      where: { topicId, status: "READY" },
      orderBy: [{ version: "desc" }],
    }),
    prisma.topicContentSnapshot.findFirst({
      where: { topicId },
      orderBy: [{ version: "desc" }],
      select: { status: true, version: true },
    }),
  ]);

  if (!topic) {
    throw new NotFoundError("Topic not found");
  }

  if (!readySnapshot) {
    const latestStatusMessage = latestSnapshot
      ? ` Latest snapshot is v${latestSnapshot.version} (${latestSnapshot.status}).`
      : " No snapshots exist yet.";
    throw new ConflictError(
      `Cannot publish because there is no READY snapshot.${latestStatusMessage} Run Ingest + Generate to produce a READY snapshot first.`
    );
  }

  await prisma.$transaction([
    prisma.topicContentSnapshot.updateMany({
      where: { topicId, status: "PUBLISHED" },
      data: { status: "REJECTED" },
    }),
    prisma.topicContentSnapshot.update({
      where: { id: readySnapshot.id },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    }),
    prisma.topic.update({
      where: { id: topicId },
      data: {
        contentStatus: "PUBLISHED",
        seoTitle: readySnapshot.title,
        seoDescription: readySnapshot.metaDescription,
        canonicalSourceSummary: "Source-grounded topic synthesis with attribution",
        indexEligible: true,
      },
    }),
  ]);

  return readySnapshot;
}
