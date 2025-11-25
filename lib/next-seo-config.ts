/**
 * Default SEO configuration for next-seo components
 * Centralizes site-wide SEO defaults
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.sportstrivia.in";

export const defaultSeoConfig = {
  siteName: "Sports Trivia",
  siteUrl: BASE_URL,
  locale: "en_US",
  twitter: {
    handle: "@sportstrivia",
    site: "@sportstrivia",
    cardType: "summary_large_image" as const,
  },
  organization: {
    name: "Sports Trivia Platform",
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: "Test your sports knowledge with interactive trivia quizzes covering all major sports",
  },
};

/**
 * Get default Open Graph image
 */
export function getDefaultOgImage(): string {
  return `${BASE_URL}/og-image.jpg`;
}

/**
 * Get canonical URL for a given path
 */
export function getCanonicalUrl(path: string): string {
  const baseUrl = BASE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

