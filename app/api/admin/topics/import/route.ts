import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { generateUniqueSlug } from "@/lib/services/slug.service";
import {
  topicImportSchema,
  type TopicImportItem,
  type TopicImportConflict,
  type TopicImportResult,
} from "@/lib/validations/topic-import.schema";

// POST /api/admin/topics/import - Bulk import topics from JSON
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { topics, overwriteParents } = topicImportSchema.parse(body);

    // First pass: Detect conflicts and validate
    const conflicts: TopicImportConflict[] = [];

    // Fetch all existing topics for comparison
    const existingTopics = await prisma.topic.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        parent: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    const existingTopicMap = new Map(
      existingTopics.map((t) => [t.name.toLowerCase(), t])
    );
    const existingSlugMap = new Map(
      existingTopics.map((t) => [t.slug.toLowerCase(), t])
    );

    // Build parent name/slug to ID map from imported topics
    const importedTopicNames = new Set(topics.map((t) => t.name.toLowerCase()));

    // Validate and detect conflicts
    for (const topic of topics) {
      const normalizedName = topic.name.toLowerCase();
      const existing = existingTopicMap.get(normalizedName);

      if (existing) {
        // Topic exists - check for parent conflicts
        const currentParentName = existing.parent?.name || null;
        const newParentName = topic.parentName || topic.parentSlug || null;

        if (currentParentName !== newParentName && newParentName !== null) {
          conflicts.push({
            name: topic.name,
            slug: existing.slug,
            existingParent: currentParentName,
            newParent: newParentName,
            action: overwriteParents ? "update_parent" : "skip",
          });
        } else {
          conflicts.push({
            name: topic.name,
            slug: existing.slug,
            existingParent: currentParentName,
            newParent: newParentName,
            action: "skip",
          });
        }
      } else {
        // New topic - will be created
        conflicts.push({
          name: topic.name,
          slug: topic.slug || "",
          existingParent: null,
          newParent: topic.parentName || topic.parentSlug || null,
          action: "create",
        });
      }
    }

    // If there are parent conflicts and overwriteParents is false, return conflicts for user review
    const hasParentConflicts = conflicts.some(
      (c) => c.action === "skip" && c.existingParent !== c.newParent && c.newParent !== null
    );

    if (hasParentConflicts && !overwriteParents) {
      return successResponse({
        conflicts,
        message: "Parent conflicts detected. Review and decide whether to overwrite.",
        requiresUserAction: true,
      });
    }

    // Second pass: Import topics
    const result = await importTopics(topics, overwriteParents, existingTopicMap, existingSlugMap, importedTopicNames);

    return successResponse({
      ...result,
      conflicts,
      message: `Import complete: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
    }, 201);
  } catch (error) {
    return handleError(error);
  }
}

async function importTopics(
  topics: TopicImportItem[],
  overwriteParents: boolean,
  existingTopicMap: Map<string, any>,
  existingSlugMap: Map<string, any>,
  _importedTopicNames: Set<string>
): Promise<TopicImportResult> {
  let created = 0;
  let skipped = 0;
  let updated = 0;
  const errors: string[] = [];
  const conflicts: TopicImportConflict[] = [];

  // Build dependency order (parents before children)
  const orderedTopics = topologicalSort(topics);

  // Map to store created/existing topic IDs
  const topicIdMap = new Map<string, string>();

  // Add existing topics to the map
  for (const [name, topic] of existingTopicMap.entries()) {
    topicIdMap.set(name, topic.id);
  }

  for (const topicData of orderedTopics) {
    try {
      const normalizedName = topicData.name.toLowerCase();
      const existing = existingTopicMap.get(normalizedName);

      // Resolve parent ID
      let parentId: string | null = null;
      if (topicData.parentName) {
        const parentKey = topicData.parentName.toLowerCase();
        parentId = topicIdMap.get(parentKey) || null;
        if (!parentId) {
          errors.push(`Topic "${topicData.name}": Parent "${topicData.parentName}" not found`);
          continue;
        }
      } else if (topicData.parentSlug) {
        const parentBySlug = existingSlugMap.get(topicData.parentSlug.toLowerCase());
        parentId = parentBySlug?.id || null;
        if (!parentId) {
          errors.push(`Topic "${topicData.name}": Parent with slug "${topicData.parentSlug}" not found`);
          continue;
        }
      }

      // Calculate level based on parent
      let level = 0;
      if (parentId) {
        const parent = await prisma.topic.findUnique({
          where: { id: parentId },
          select: { level: true },
        });
        level = (parent?.level ?? 0) + 1;
      }

      if (existing) {
        // Topic exists
        const parentChanged = existing.parentId !== parentId;

        if (parentChanged && overwriteParents) {
          // Update parent
          await prisma.topic.update({
            where: { id: existing.id },
            data: {
              parentId,
              level,
              description: topicData.description || existing.description,
              displayImageUrl: topicData.imageUrl || undefined,
            },
          });
          updated++;
        } else {
          // Skip - topic exists and no parent update requested
          skipped++;
        }
      } else {
        // Create new topic
        const slug = topicData.slug
          ? await generateUniqueSlug(topicData.slug, "topic")
          : await generateUniqueSlug(topicData.name, "topic");

        const newTopic = await prisma.topic.create({
          data: {
            name: topicData.name,
            slug,
            description: topicData.description,
            displayImageUrl: topicData.imageUrl,
            parentId,
            level,
          },
        });

        topicIdMap.set(normalizedName, newTopic.id);
        created++;
      }
    } catch (error: any) {
      errors.push(`Topic "${topicData.name}": ${error.message}`);
    }
  }

  return {
    created,
    skipped,
    updated,
    conflicts,
    errors,
  };
}

// Topological sort to ensure parents are created before children
function topologicalSort(topics: TopicImportItem[]): TopicImportItem[] {
  const result: TopicImportItem[] = [];
  const visited = new Set<string>();
  const topicMap = new Map(topics.map((t) => [t.name.toLowerCase(), t]));

  function visit(topic: TopicImportItem) {
    const key = topic.name.toLowerCase();
    if (visited.has(key)) return;

    // Visit parent first if it exists in the import
    if (topic.parentName) {
      const parent = topicMap.get(topic.parentName.toLowerCase());
      if (parent) {
        visit(parent);
      }
    }

    visited.add(key);
    result.push(topic);
  }

  for (const topic of topics) {
    visit(topic);
  }

  return result;
}

