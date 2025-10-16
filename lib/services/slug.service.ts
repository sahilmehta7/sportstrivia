import { prisma } from "@/lib/db";
import { ValidationError } from "@/lib/errors";

/**
 * Cache for slug existence checks
 * Stores slugs that we've recently checked
 */
interface SlugCache {
  existingSlugs: Set<string>;
  lastUpdated: number;
}

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

const slugCache: Map<string, SlugCache> = new Map();

/**
 * Entity types that support slugs
 */
export type SlugEntity = "quiz" | "topic" | "tag";

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  if (!title || typeof title !== "string") {
    throw new ValidationError("Title is required to generate a slug");
  }

  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Check if cache for an entity is valid
 */
function isCacheValid(entity: SlugEntity): boolean {
  const cache = slugCache.get(entity);
  if (!cache) return false;
  return Date.now() - cache.lastUpdated < CACHE_DURATION;
}

/**
 * Get cached existing slugs or fetch from database
 */
async function getExistingSlugs(entity: SlugEntity): Promise<Set<string>> {
  if (isCacheValid(entity)) {
    return slugCache.get(entity)!.existingSlugs;
  }

  // Fetch all slugs for this entity type
  let slugs: string[] = [];

  switch (entity) {
    case "quiz":
      {
        const quizzes = await prisma.quiz.findMany({
          select: { slug: true },
        });
        slugs = quizzes.map((q) => q.slug);
        break;
      }

    case "topic":
      {
        const topics = await prisma.topic.findMany({
          select: { slug: true },
        });
        slugs = topics.map((t) => t.slug);
        break;
      }

    case "tag":
      {
        const tags = await prisma.quizTag.findMany({
          select: { slug: true },
        });
        slugs = tags.map((t) => t.slug);
        break;
      }

    default:
      throw new Error(`Unknown entity type: ${entity}`);
  }

  const existingSlugs = new Set(slugs);

  slugCache.set(entity, {
    existingSlugs,
    lastUpdated: Date.now(),
  });

  return existingSlugs;
}

/**
 * Generate a unique slug by appending a number if needed
 * Uses memoized slug lookups for better performance
 */
export async function generateUniqueSlug(
  title: string,
  entity: SlugEntity = "quiz",
  existingSlug?: string
): Promise<string> {
  if (!title) {
    throw new ValidationError("Title is required to generate a slug");
  }

  const baseSlug = generateSlug(title);

  if (!baseSlug) {
    throw new ValidationError("Unable to generate a valid slug from the provided title");
  }

  // If this is an update and slug hasn't changed, return it
  if (existingSlug === baseSlug) {
    return baseSlug;
  }

  // Get existing slugs (cached)
  const existingSlugs = await getExistingSlugs(entity);

  // Check if base slug is available
  if (!existingSlugs.has(baseSlug)) {
    // Add to cache
    existingSlugs.add(baseSlug);
    return baseSlug;
  }

  // Append number to make it unique
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.has(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;

    // Safety check to prevent infinite loops
    if (counter > 1000) {
      throw new Error("Unable to generate a unique slug after 1000 attempts");
    }
  }

  // Add to cache
  existingSlugs.add(uniqueSlug);

  return uniqueSlug;
}

/**
 * Validate a slug format
 */
export function validateSlugFormat(slug: string): boolean {
  if (!slug || typeof slug !== "string") return false;

  // Slug should only contain lowercase letters, numbers, and hyphens
  // Should not start or end with a hyphen
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  return slugRegex.test(slug);
}

/**
 * Check if a slug is available for use
 */
export async function isSlugAvailable(
  slug: string,
  entity: SlugEntity = "quiz",
  excludeId?: string
): Promise<boolean> {
  if (!validateSlugFormat(slug)) {
    return false;
  }

  let exists = false;

  switch (entity) {
    case "quiz":
      {
        const quiz = await prisma.quiz.findUnique({
          where: { slug },
          select: { id: true },
        });
        exists = quiz !== null && quiz.id !== excludeId;
        break;
      }

    case "topic":
      {
        const topic = await prisma.topic.findUnique({
          where: { slug },
          select: { id: true },
        });
        exists = topic !== null && topic.id !== excludeId;
        break;
      }

    case "tag":
      {
        const tag = await prisma.quizTag.findUnique({
          where: { slug },
          select: { id: true },
        });
        exists = tag !== null && tag.id !== excludeId;
        break;
      }
  }

  return !exists;
}

/**
 * Invalidate slug cache for an entity type
 * Call this after creating/updating/deleting entities with slugs
 */
export function invalidateSlugCache(entity: SlugEntity): void {
  slugCache.delete(entity);
}

/**
 * Invalidate all slug caches
 */
export function invalidateAllSlugCaches(): void {
  slugCache.clear();
}
