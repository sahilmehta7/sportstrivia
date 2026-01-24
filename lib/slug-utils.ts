/**
 * Generate a URL-friendly slug from a title.
 * This is a pure string manipulation function and is safe for client-side use.
 */
export function generateSlug(title: string): string {
    if (!title || typeof title !== "string") {
        return "";
    }

    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}
