/**
 * Input sanitization utilities for preventing XSS and other injection attacks.
 * 
 * Uses a simple regex-based approach for server-side sanitization.
 * For rich text that needs HTML, consider using DOMPurify on the client side.
 */

// HTML entities to escape
const HTML_ENTITIES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
};

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(str: string): string {
    return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip all HTML tags from a string
 */
export function stripHtml(str: string): string {
    return str.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize text input - strips HTML and trims whitespace
 */
export function sanitizeText(input: string): string {
    if (typeof input !== "string") {
        return "";
    }
    return stripHtml(input).trim();
}

/**
 * Sanitize text while preserving newlines (for multi-line text fields)
 */
export function sanitizeMultilineText(input: string): string {
    if (typeof input !== "string") {
        return "";
    }
    // Preserve newlines but strip HTML
    return stripHtml(input)
        .split("\n")
        .map((line) => line.trim())
        .join("\n")
        .trim();
}

/**
 * Sanitize a URL - validates and returns null if invalid
 */
export function sanitizeUrl(input: string): string | null {
    if (typeof input !== "string") {
        return null;
    }

    const trimmed = input.trim();

    // Check for javascript: protocol and other dangerous schemes
    const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"];
    const lowerUrl = trimmed.toLowerCase();

    for (const protocol of dangerousProtocols) {
        if (lowerUrl.startsWith(protocol)) {
            return null;
        }
    }

    // Must be a valid URL
    try {
        const url = new URL(trimmed);
        // Only allow http and https
        if (!["http:", "https:"].includes(url.protocol)) {
            return null;
        }
        return url.toString();
    } catch {
        // If it's a relative URL starting with /, allow it
        if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
            return trimmed;
        }
        return null;
    }
}

/**
 * Sanitize an email address
 */
export function sanitizeEmail(input: string): string | null {
    if (typeof input !== "string") {
        return null;
    }

    const trimmed = input.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
        return null;
    }

    return trimmed;
}

/**
 * Sanitize a slug (URL-safe identifier)
 */
export function sanitizeSlug(input: string): string {
    if (typeof input !== "string") {
        return "";
    }

    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, "-") // Replace non-alphanumeric with hyphens
        .replace(/-+/g, "-") // Replace multiple hyphens with single
        .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Sanitize an object's string fields recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(
    obj: T,
    fieldsToSanitize?: string[]
): T {
    const result = { ...obj };

    for (const [key, value] of Object.entries(result)) {
        // Skip if fieldsToSanitize is specified and this field isn't in it
        if (fieldsToSanitize && !fieldsToSanitize.includes(key)) {
            continue;
        }

        if (typeof value === "string") {
            // Determine sanitization based on field name
            if (key.toLowerCase().includes("email")) {
                const sanitized = sanitizeEmail(value);
                (result as Record<string, unknown>)[key] = sanitized ?? "";
            } else if (key.toLowerCase().includes("url") || key.toLowerCase().includes("link")) {
                const sanitized = sanitizeUrl(value);
                (result as Record<string, unknown>)[key] = sanitized ?? "";
            } else if (key.toLowerCase().includes("slug")) {
                (result as Record<string, unknown>)[key] = sanitizeSlug(value);
            } else if (
                key.toLowerCase().includes("description") ||
                key.toLowerCase().includes("bio") ||
                key.toLowerCase().includes("content") ||
                key.toLowerCase().includes("comment")
            ) {
                (result as Record<string, unknown>)[key] = sanitizeMultilineText(value);
            } else {
                (result as Record<string, unknown>)[key] = sanitizeText(value);
            }
        } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            (result as Record<string, unknown>)[key] = sanitizeObject(
                value as Record<string, unknown>,
                fieldsToSanitize
            );
        }
    }

    return result;
}

/**
 * Validate that a string contains no SQL injection patterns
 * Note: This is a defense-in-depth measure - parameterized queries should be the primary defense
 */
export function containsSqlInjection(input: string): boolean {
    if (typeof input !== "string") {
        return false;
    }

    // Only check for dangerous patterns, not all SQL keywords
    const dangerousPatterns = [
        /(\bDROP\b)/i,
        /(\bDELETE\b\s+FROM\b)/i,
        /(\bUNION\b\s+SELECT\b)/i,
        /(--)/,
        /(\bOR\b\s*['"]?\s*1\s*=\s*1)/i,
    ];

    return dangerousPatterns.some((pattern) => pattern.test(input));
}
