import { prisma } from "./db";
import { generateSlug } from "./slug-utils";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.sportstrivia.in";

/**
 * Get the canonical URL for a given path
 */
export function getCanonicalUrl(path: string): string {
  // Remove trailing slashes from BASE_URL
  const baseUrl = BASE_URL.replace(/\/$/, "");

  // Ensure path starts with /
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${cleanPath}`;
}

/**
 * Generate Open Graph meta tags
 */
export function generateOpenGraphTags({
  title,
  description,
  url,
  imageUrl,
  type = "website",
  siteName = "Sports Trivia",
}: {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  type?: string;
  siteName?: string;
}) {
  const image = imageUrl || `${BASE_URL}/og-image.jpg`;

  return {
    "og:title": title,
    "og:description": description,
    "og:url": url,
    "og:type": type,
    "og:site_name": siteName,
    "og:locale": "en_US",
    "og:image": image,
    "og:image:width": "1200",
    "og:image:height": "630",
  };
}

/**
 * Generate Twitter Card meta tags
 */
export function generateTwitterCardTags({
  title,
  description,
  imageUrl,
  cardType = "summary_large_image",
}: {
  title: string;
  description: string;
  imageUrl?: string;
  cardType?: "summary" | "summary_large_image";
}) {
  const image = imageUrl || `${BASE_URL}/og-image.jpg`;

  return {
    "twitter:card": cardType,
    "twitter:title": title,
    "twitter:description": description,
    "twitter:image": image,
  };
}


/**
 * Generate a unique slug by appending a number if needed
 */
export async function generateUniqueSlug(
  title: string,
  existingSlug?: string
): Promise<string> {
  const baseSlug = generateSlug(title);

  // If this is an update and slug hasn't changed, return it
  if (existingSlug === baseSlug) {
    return baseSlug;
  }

  // Check if slug exists
  const existing = await prisma.quiz.findUnique({
    where: { slug: baseSlug },
  });

  if (!existing) {
    return baseSlug;
  }

  // Append number to make it unique
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (await prisma.quiz.findUnique({ where: { slug: uniqueSlug } })) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}

/**
 * Generate meta tags for a quiz
 */
export interface MetaTags {
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export function generateQuizMetaTags(quiz: {
  title: string;
  slug: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  sport?: string | null;
  difficulty: string;
  descriptionImageUrl?: string | null;
}): MetaTags {
  // Prioritize AI-generated SEO fields if present
  const title = quiz.seoTitle || `${quiz.title} Trivia Quiz - Test Your Knowledge`;
  const description =
    quiz.seoDescription ||
    quiz.description ||
    `Challenge your knowledge with this ${quiz.difficulty.toLowerCase()} ${quiz.sport || "sports"} trivia. Battle fans and climb the leaderboard!`;

  const keywords = quiz.seoKeywords && quiz.seoKeywords.length > 0
    ? quiz.seoKeywords
    : [
      quiz.sport || "sports",
      "trivia",
      "quiz",
      quiz.difficulty.toLowerCase(),
      "stats",
      "history",
      "test your knowledge",
    ];

  const trimmedDescription = description.length > 160
    ? `${description.substring(0, 157)}...`
    : description;

  const canonicalUrl = getCanonicalUrl(`/quizzes/${quiz.slug}`);

  return {
    title,
    description: trimmedDescription,
    keywords,
    ogTitle: title,
    ogDescription: trimmedDescription,
    ogImage: quiz.descriptionImageUrl || undefined,
    canonicalUrl,
  };
}

/**
 * Generate sitemap entries for all published quizzes
 */
export async function generateQuizSitemapEntries() {
  const quizzes = await prisma.quiz.findMany({
    where: { isPublished: true, status: "PUBLISHED" },
    select: {
      slug: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return quizzes.map((quiz) => ({
    url: `/quizzes/${quiz.slug}`,
    lastModified: quiz.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}

