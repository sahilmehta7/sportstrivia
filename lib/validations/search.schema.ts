import { z } from "zod";

/**
 * Schema for validating search query input
 * Enforces max length, trims whitespace, and sanitizes input
 */
export const searchQuerySchema = z
  .string()
  .max(200, "Search query must be 200 characters or less")
  .transform((val) => {
    // Trim whitespace
    const trimmed = val.trim();
    // Remove excessive whitespace (replace multiple spaces with single space)
    const normalized = trimmed.replace(/\s+/g, " ");
    return normalized;
  })
  .pipe(
    z.string().max(200, "Search query must be 200 characters or less")
  );

/**
 * Optional search query schema (for optional search parameters)
 */
export const optionalSearchQuerySchema = searchQuerySchema.optional().nullable();

/**
 * Validate and sanitize a search query
 * @param query - The search query to validate
 * @returns Sanitized search query or null if invalid/empty
 */
export function validateSearchQuery(query: string | null | undefined): string | null {
  if (!query) {
    return null;
  }

  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return null;
  }

  // If query is too long, truncate it rather than rejecting
  if (trimmed.length > 200) {
    return trimmed.slice(0, 200).trim();
  }

  try {
    const result = searchQuerySchema.parse(query);
    // Return null if result is empty after trimming
    return result.length > 0 ? result : null;
  } catch {
    // If validation fails but query is reasonable, just normalize it manually
    // This is more permissive and prevents valid queries from being rejected
    const normalized = trimmed.replace(/\s+/g, " ").trim();
    return normalized.length > 0 && normalized.length <= 200 ? normalized : null;
  }
}

/**
 * Validate search query and throw error if invalid (for strict validation)
 * @param query - The search query to validate
 * @returns Sanitized search query
 * @throws ZodError if validation fails
 */
export function validateSearchQueryStrict(query: string | null | undefined): string {
  if (!query) {
    throw new Error("Search query is required");
  }
  return searchQuerySchema.parse(query);
}

