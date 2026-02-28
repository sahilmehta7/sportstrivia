import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { parseTopicEntityData, sanitizeUrlList } from "@/lib/topic-schema";
import type { TopicSchemaTypeValue } from "@/lib/topic-schema-options";
import { lookupWikipediaTopicMetadata } from "@/lib/admin/topic-wikipedia";

const bulkSchema = z.object({
  limit: z.number().int().min(1).max(200).optional().default(50),
  dryRun: z.boolean().optional().default(false),
});

type JsonRecord = Record<string, unknown>;

function isPlainObject(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function needsWikipediaEnrichment(topic: {
  schemaType: string;
  schemaCanonicalUrl: string | null;
  schemaSameAs: string[];
  description: string | null;
}): boolean {
  if (topic.schemaType === "NONE") return true;
  if (!topic.schemaCanonicalUrl) return true;
  if (!Array.isArray(topic.schemaSameAs) || topic.schemaSameAs.length === 0) return true;
  if (!topic.description || !topic.description.trim()) return true;
  return false;
}

function mergeEntityData(
  schemaType: TopicSchemaTypeValue,
  existing: unknown,
  incoming: {
    sportName: string;
    leagueName: string;
    organizationName: string;
    teamName: string;
    nationality: string;
    birthDate: string;
    startDate: string;
    endDate: string;
    locationName: string;
    organizerName: string;
    aliases: string[];
  }
): JsonRecord | null {
  const base: JsonRecord = isPlainObject(existing) ? { ...existing } : {};
  const assignIfMissing = (key: string, value: string) => {
    if (!value) return;
    if (!base[key] || (typeof base[key] === "string" && !String(base[key]).trim())) {
      base[key] = value;
    }
  };

  if (schemaType === "SPORT") {
    if ((!Array.isArray(base.aliases) || base.aliases.length === 0) && incoming.aliases.length > 0) {
      base.aliases = incoming.aliases;
    }
  } else if (schemaType === "SPORTS_TEAM") {
    assignIfMissing("sportName", incoming.sportName);
    assignIfMissing("leagueName", incoming.leagueName);
    assignIfMissing("organizationName", incoming.organizationName);
  } else if (schemaType === "ATHLETE") {
    assignIfMissing("sportName", incoming.sportName);
    assignIfMissing("teamName", incoming.teamName);
    assignIfMissing("nationality", incoming.nationality);
    assignIfMissing("birthDate", incoming.birthDate);
  } else if (schemaType === "SPORTS_ORGANIZATION") {
    assignIfMissing("sportName", incoming.sportName);
  } else if (schemaType === "SPORTS_EVENT") {
    assignIfMissing("sportName", incoming.sportName);
    assignIfMissing("startDate", incoming.startDate);
    assignIfMissing("endDate", incoming.endDate);
    assignIfMissing("locationName", incoming.locationName);
    assignIfMissing("organizerName", incoming.organizerName);
  } else {
    return null;
  }

  return Object.keys(base).length > 0 ? base : null;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => ({}));
    const { limit, dryRun } = bulkSchema.parse(body);

    const allTopics = await prisma.topic.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        schemaType: true,
        schemaCanonicalUrl: true,
        schemaSameAs: true,
        schemaEntityData: true,
        displayImageUrl: true,
        description: true,
      },
    });

    const candidates = allTopics.filter(needsWikipediaEnrichment).slice(0, limit);
    const results: Array<{
      topicId: string;
      topicName: string;
      status: "updated" | "failed" | "skipped";
      reason?: string;
    }> = [];

    let updatedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const topic of candidates) {
      try {
        const metadata = await lookupWikipediaTopicMetadata(topic.name);
        const nextSchemaType = (topic.schemaType === "NONE"
          ? metadata.schemaType
          : topic.schemaType) as TopicSchemaTypeValue;
        const nextCanonicalUrl = topic.schemaCanonicalUrl || metadata.schemaCanonicalUrl || null;
        const nextSameAs = sanitizeUrlList([
          ...(topic.schemaSameAs || []),
          ...(metadata.schemaSameAs || []),
        ]);
        const nextDescription = topic.description || metadata.extract || metadata.description || null;
        const nextDisplayImageUrl = topic.displayImageUrl || metadata.imageUrl || null;
        const mergedEntityData = mergeEntityData(nextSchemaType, topic.schemaEntityData, metadata);
        const parsedEntityData = parseTopicEntityData(nextSchemaType, mergedEntityData);
        const schemaEntityDataValue =
          parsedEntityData === null ? Prisma.JsonNull : (parsedEntityData as Prisma.InputJsonValue);

        if (dryRun) {
          results.push({
            topicId: topic.id,
            topicName: topic.name,
            status: "skipped",
            reason: "dry-run",
          });
          skippedCount += 1;
          continue;
        }

        await prisma.topic.update({
          where: { id: topic.id },
          data: {
            schemaType: nextSchemaType,
            schemaCanonicalUrl: nextCanonicalUrl,
            schemaSameAs: nextSameAs,
            description: nextDescription,
            displayImageUrl: nextDisplayImageUrl,
            schemaEntityData: schemaEntityDataValue,
          },
        });

        results.push({
          topicId: topic.id,
          topicName: topic.name,
          status: "updated",
        });
        updatedCount += 1;
      } catch (error: any) {
        results.push({
          topicId: topic.id,
          topicName: topic.name,
          status: "failed",
          reason: error?.message || "Unknown error",
        });
        failedCount += 1;
      }
    }

    return successResponse({
      scanned: allTopics.length,
      candidates: candidates.length,
      updated: updatedCount,
      failed: failedCount,
      skipped: skippedCount,
      dryRun,
      results,
    });
  } catch (error) {
    return handleError(error);
  }
}
