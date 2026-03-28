import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import type { TopicClaimType } from "@/lib/services/topic-content/types";

const MAX_ARRAY_ITEMS = 25;
const MAX_OBJECT_DEPTH = 6;
const MAX_CLAIMS = 200;
const MAX_CLAIM_TEXT_LENGTH = 1000;
const MIN_FACT_STRING_LENGTH = 10;

function hashClaim(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

type SeenClaim = {
  id: string;
  confidence: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getPathSegments(path: string): string[] {
  return path
    .replace(/\[\d+\]/g, ".")
    .split(".")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getPathDepth(path: string): number {
  return getPathSegments(path).length;
}

function isIgnoredPath(path: string): boolean {
  const ignoredExact = new Set([
    "collectedat",
    "mode",
    "sourcename",
    "fetcherror",
    "id",
    "ids",
    "hash",
    "etag",
    "uuid",
  ]);

  const ignoredSuffixes = ["url", "sourceurl", "uri", "href", "slug", "code", "identifier"];

  const segments = getPathSegments(path).map((segment) => segment.toLowerCase());
  if (segments.length === 0) return true;

  return segments.some((segment) => {
    if (ignoredExact.has(segment)) return true;
    return ignoredSuffixes.some((suffix) => segment.endsWith(suffix));
  });
}

function getSignalScore(path: string): number {
  const normalized = path.toLowerCase();
  let score = 0;

  if (/(^|\.)(extract|description|summary|label|title|abstract)$/.test(normalized)) score += 3;
  if (/(^|\.)(claims|awardreceived|occupation|sport|dateofbirth|dateofdeath|instanceof|countryofcitizenship|memberofsportsteam)/.test(normalized)) score += 2;
  if (/(^|\.)(aliases|timeline|analysis|keyfacts)/.test(normalized)) score += 1;

  if (/(^|\.)(id|ids|hash|uuid|mode|sourcename|collectedat)/.test(normalized)) score -= 3;
  if (/(^|\.)(url|sourceurl|uri|href|slug|code|identifier)/.test(normalized)) score -= 2;

  const depth = getPathDepth(path);
  if (depth >= 5) score -= 1;
  if (depth >= 7) score -= 1;

  return score;
}

export function inferClaimType(text: string): TopicClaimType {
  if (/\b\d{4}\b/.test(text) || /\b(started|founded|began|won|ended)\b/i.test(text)) {
    return "TIMELINE";
  }
  if (/\b(stat|record|average|percent|%|total)\b/i.test(text)) {
    return "STAT";
  }
  if (/\bteam|league|organization|member|coach|player\b/i.test(text)) {
    return "ENTITY_RELATION";
  }
  return "FACT";
}

export function extractClaimsFromPayload(payload: Record<string, unknown>): string[] {
  const candidates: Array<{ claim: string; priority: number }> = [];

  const walk = (value: unknown, path: string, depth: number) => {
    if (!path || depth > MAX_OBJECT_DEPTH || isIgnoredPath(path)) return;

    if (typeof value === "string") {
      const text = value.trim();
      if (text.length >= MIN_FACT_STRING_LENGTH) {
        const claim = `${path}: ${text.slice(0, MAX_CLAIM_TEXT_LENGTH)}`;
        const priority = getSignalScore(path) + Math.min(2, Math.floor(text.length / 200));
        candidates.push({ claim, priority });
      }
      return;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      const claim = `${path}: ${String(value)}`;
      const priority = getSignalScore(path);
      candidates.push({ claim, priority });
      return;
    }

    if (Array.isArray(value)) {
      for (let i = 0; i < Math.min(value.length, MAX_ARRAY_ITEMS); i++) {
        walk(value[i], `${path}[${i}]`, depth + 1);
      }
      return;
    }

    if (value && typeof value === "object") {
      for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
        walk(nested, `${path}.${key}`, depth + 1);
      }
    }
  };

  for (const [key, raw] of Object.entries(payload)) {
    walk(raw, key, 0);
  }

  const deduped = new Map<string, number>();
  for (const candidate of candidates) {
    const existing = deduped.get(candidate.claim);
    if (existing === undefined || candidate.priority > existing) {
      deduped.set(candidate.claim, candidate.priority);
    }
  }

  return Array.from(deduped.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      if (b[0].length !== a[0].length) return b[0].length - a[0].length;
      return a[0].localeCompare(b[0]);
    })
    .slice(0, MAX_CLAIMS)
    .map(([claim]) => claim);
}

function computeClaimConfidence(input: {
  isCommercialSafe: boolean;
  claimText: string;
}): number {
  const splitIndex = input.claimText.indexOf(":");
  const path = splitIndex > -1 ? input.claimText.slice(0, splitIndex) : input.claimText;
  const value = splitIndex > -1 ? input.claimText.slice(splitIndex + 1).trim() : "";

  let confidence = input.isCommercialSafe ? 0.78 : 0.58;

  const signalScore = getSignalScore(path);
  confidence += signalScore * 0.04;

  const depth = getPathDepth(path);
  if (depth >= 5) confidence -= 0.05;
  if (depth >= 7) confidence -= 0.05;

  if (value.length > 180) confidence += 0.04;
  else if (value.length < 20) confidence -= 0.04;

  return Number(clamp(confidence, 0.3, 0.98).toFixed(2));
}

export async function normalizeTopicSourceDocuments(topicId: string) {
  const docs = await prisma.topicSourceDocument.findMany({
    where: { topicId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const existing = await prisma.topicClaim.findMany({
    where: { topicId },
    select: { id: true, claimText: true, confidence: true },
  });
  const seen = new Map<string, SeenClaim>(
    existing.map((claim) => [
      hashClaim(claim.claimText),
      { id: claim.id, confidence: claim.confidence },
    ])
  );

  let inserted = 0;
  let skipped = 0;

  for (const doc of docs) {
    const payload = (doc.rawPayload ?? {}) as Record<string, unknown>;
    const candidates = extractClaimsFromPayload(payload);
    for (const claimText of candidates) {
      const key = hashClaim(claimText);
      const candidateConfidence = computeClaimConfidence({
        isCommercialSafe: doc.isCommercialSafe,
        claimText,
      });
      const existingClaim = seen.get(key);
      if (existingClaim) {
        if (candidateConfidence > existingClaim.confidence) {
          await prisma.topicClaim.update({
            where: { id: existingClaim.id },
            data: {
              claimType: inferClaimType(claimText),
              confidence: candidateConfidence,
              sourceDocumentId: doc.id,
              sourceSnippet: claimText.slice(0, 320),
            },
          });
          seen.set(key, { id: existingClaim.id, confidence: candidateConfidence });
        } else {
          skipped++;
        }
        continue;
      }

      const created = await prisma.topicClaim.create({
        data: {
          topicId,
          claimText,
          claimType: inferClaimType(claimText),
          confidence: candidateConfidence,
          sourceDocumentId: doc.id,
          sourceSnippet: claimText.slice(0, 320),
        },
      });
      seen.set(key, { id: created.id, confidence: candidateConfidence });
      inserted++;
    }
  }

  return { inserted, skipped };
}
