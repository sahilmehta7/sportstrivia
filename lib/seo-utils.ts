import { prisma } from "./db";

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
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
}

export function generateQuizMetaTags(quiz: {
  title: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  sport?: string | null;
  difficulty: string;
}): MetaTags {
  const title = quiz.seoTitle || `${quiz.title} - Sports Trivia Quiz`;
  const description =
    quiz.seoDescription ||
    quiz.description ||
    `Test your knowledge with our ${quiz.difficulty.toLowerCase()} ${quiz.sport || "sports"} trivia quiz. Challenge friends and climb the leaderboard!`;
  
  const keywords = quiz.seoKeywords || [
    quiz.sport || "sports",
    "trivia",
    "quiz",
    quiz.difficulty.toLowerCase(),
    "test your knowledge",
  ];

  return {
    title,
    description: description.substring(0, 160),
    keywords,
    ogTitle: title,
    ogDescription: description.substring(0, 160),
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
    url: `/quiz/${quiz.slug}`,
    lastModified: quiz.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}

