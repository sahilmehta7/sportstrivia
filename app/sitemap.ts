import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.sportstrivia.in";

  let quizzes: Array<{ slug: string; updatedAt: Date }> = [];
  let topics: Array<{ slug: string; updatedAt: Date }> = [];

  try {
    quizzes = await prisma.quiz.findMany({
      where: {
        isPublished: true,
        status: "PUBLISHED",
      },
      select: {
        slug: true,
        updatedAt: true,
      },
    });

    topics = await prisma.topic.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    console.warn("[sitemap] Falling back to static routes. Reason:", error);
  }

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/quizzes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/topics`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/challenges`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
  ];

  // Quiz pages
  const quizPages: MetadataRoute.Sitemap = quizzes.map((quiz) => ({
    url: `${baseUrl}/quizzes/${quiz.slug}`,
    lastModified: quiz.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Topic pages
  const topicPages: MetadataRoute.Sitemap = topics.map((topic) => ({
    url: `${baseUrl}/topics/${topic.slug}`,
    lastModified: topic.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [...staticPages, ...quizPages, ...topicPages];
}
