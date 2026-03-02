import { createHash } from "crypto";
import { prisma } from "@/lib/db";
import type { TopicClaimType } from "@/lib/services/topic-content/types";

function hashClaim(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
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
  const values: string[] = [];
  const ignoredPath = /^(collectedAt|mode|sourceName|fetchError)$/i;
  const ignoredSuffix = /(url|sourceUrl)$/i;

  const walk = (value: unknown, path: string) => {
    if (!path) return;
    if (ignoredPath.test(path) || ignoredSuffix.test(path)) return;

    if (typeof value === "string") {
      const text = value.trim();
      if (text.length >= 2) {
        values.push(`${path}: ${text.slice(0, 320)}`);
      }
      return;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      values.push(`${path}: ${String(value)}`);
      return;
    }

    if (Array.isArray(value)) {
      for (let i = 0; i < Math.min(value.length, 25); i++) {
        walk(value[i], `${path}[${i}]`);
      }
      return;
    }

    if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        walk(v, path ? `${path}.${k}` : k);
      }
    }
  };

  for (const [key, raw] of Object.entries(payload)) {
    walk(raw, key);
  }

  const deduped = Array.from(new Set(values));
  return deduped.slice(0, 200);
}

export async function normalizeTopicSourceDocuments(topicId: string) {
  const docs = await prisma.topicSourceDocument.findMany({
    where: { topicId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const existing = await prisma.topicClaim.findMany({
    where: { topicId },
    select: { claimText: true },
  });
  const seen = new Set(existing.map((c) => hashClaim(c.claimText)));

  let inserted = 0;
  let skipped = 0;

  for (const doc of docs) {
    const payload = (doc.rawPayload ?? {}) as Record<string, unknown>;
    const candidates = extractClaimsFromPayload(payload);
    for (const claimText of candidates) {
      const key = hashClaim(claimText);
      if (seen.has(key)) {
        skipped++;
        continue;
      }

      await prisma.topicClaim.create({
        data: {
          topicId,
          claimText,
          claimType: inferClaimType(claimText),
          confidence: doc.isCommercialSafe ? 0.8 : 0.6,
          sourceDocumentId: doc.id,
          sourceSnippet: claimText.slice(0, 240),
        },
      });
      seen.add(key);
      inserted++;
    }
  }

  return { inserted, skipped };
}
