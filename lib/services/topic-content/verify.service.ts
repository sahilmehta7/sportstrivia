import { prisma } from "@/lib/db";

export function normalizeClaimForConflict(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s:.-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function verifyTopicClaims(topicId: string) {
  const claims = await prisma.topicClaim.findMany({
    where: { topicId },
    orderBy: [{ confidence: "desc" }, { createdAt: "asc" }],
  });

  const canonicalByKey = new Map<string, string>();
  const contradictedIds: string[] = [];
  const selectedIds: string[] = [];

  for (const claim of claims) {
    const key = normalizeClaimForConflict(claim.claimText);
    if (!canonicalByKey.has(key)) {
      canonicalByKey.set(key, claim.id);
      selectedIds.push(claim.id);
      continue;
    }
    contradictedIds.push(claim.id);
  }

  await prisma.$transaction([
    prisma.topicClaim.updateMany({
      where: { topicId },
      data: { isContradicted: false, isSelectedForPublish: false },
    }),
    ...(selectedIds.length > 0
      ? [
          prisma.topicClaim.updateMany({
            where: { id: { in: selectedIds } },
            data: { isSelectedForPublish: true },
          }),
        ]
      : []),
    ...(contradictedIds.length > 0
      ? [
          prisma.topicClaim.updateMany({
            where: { id: { in: contradictedIds } },
            data: { isContradicted: true },
          }),
        ]
      : []),
  ]);

  return {
    totalClaims: claims.length,
    selected: selectedIds.length,
    contradicted: contradictedIds.length,
  };
}
