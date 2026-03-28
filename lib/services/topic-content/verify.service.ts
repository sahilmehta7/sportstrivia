import { prisma } from "@/lib/db";

const MAX_SELECTED_FOR_PUBLISH = 200;
const UPDATE_CHUNK_SIZE = 500;

type ClaimRecord = {
  id: string;
  claimText: string;
};

export function normalizeClaimForConflict(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s:.-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function partitionClaimsForVerification(
  claims: ClaimRecord[],
  maxSelected = MAX_SELECTED_FOR_PUBLISH
) {
  const canonicalByKey = new Map<string, string>();
  const contradictedIds: string[] = [];
  const selectedIds: string[] = [];
  const overflowIds: string[] = [];

  for (const claim of claims) {
    const key = normalizeClaimForConflict(claim.claimText);
    if (canonicalByKey.has(key)) {
      contradictedIds.push(claim.id);
      continue;
    }

    canonicalByKey.set(key, claim.id);
    if (selectedIds.length < maxSelected) {
      selectedIds.push(claim.id);
    } else {
      overflowIds.push(claim.id);
    }
  }

  return { selectedIds, contradictedIds, overflowIds };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function verifyTopicClaims(topicId: string) {
  const claims = await prisma.topicClaim.findMany({
    where: { topicId },
    orderBy: [{ confidence: "desc" }, { createdAt: "asc" }],
    select: { id: true, claimText: true },
  });

  const { selectedIds, contradictedIds } = partitionClaimsForVerification(claims);

  const operations = [
    prisma.topicClaim.updateMany({
      where: { topicId },
      data: { isContradicted: false, isSelectedForPublish: false },
    }),
  ];

  for (const chunk of chunkArray(selectedIds, UPDATE_CHUNK_SIZE)) {
    operations.push(
      prisma.topicClaim.updateMany({
        where: { id: { in: chunk } },
        data: { isSelectedForPublish: true },
      })
    );
  }

  for (const chunk of chunkArray(contradictedIds, UPDATE_CHUNK_SIZE)) {
    operations.push(
      prisma.topicClaim.updateMany({
        where: { id: { in: chunk } },
        data: { isContradicted: true },
      })
    );
  }

  await prisma.$transaction(operations);

  return {
    totalClaims: claims.length,
    selected: selectedIds.length,
    contradicted: contradictedIds.length,
  };
}
