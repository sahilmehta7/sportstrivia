import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchContext } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getRootTopics, getFeaturedTopics, getL2TopicsForPopularSports } from "@/lib/services/topic.service";
import {
  getRecentSearchQueriesForUser,
  getTrendingSearchQueries,
} from "@/lib/services/search-query.service";
import { TopicsContent } from "@/components/topics/TopicsContent";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { TopicCardSkeleton } from "@/components/shared/skeletons";
import { PageContainer } from "@/components/shared/PageContainer";

export const metadata: Metadata = {
  title: "Sports Topics - Explore by Category",
  description: "Browse sports trivia quizzes by topic. Explore football, cricket, basketball, tennis, and more. Find quizzes on your favorite sports and topics.",
  keywords: ["sports topics", "sports categories", "trivia topics", "sports quizzes", "football trivia", "cricket trivia"],
  openGraph: {
    title: "Sports Topics - Explore by Category",
    description: "Browse sports trivia quizzes by topic. Explore football, cricket, basketball, tennis, and more. Find quizzes on your favorite sports and topics.",
    type: "website",
    url: "/topics",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sports Topics - Explore by Category",
    description: "Browse sports trivia quizzes by topic. Explore football, cricket, basketball, tennis, and more.",
  },
  alternates: {
    canonical: "/topics",
  },
};

// Route segment config
export const dynamic = 'auto';
export const revalidate = 3600; // Revalidate every hour

// Color pairs matching the showcase design
const colorPairs = [
  { dark: "#7c2d12", light: "#fde68a" },
  { dark: "#065f46", light: "#bbf7d0" },
  { dark: "#1e3a8a", light: "#bfdbfe" },
  { dark: "#7c3aed", light: "#e9d5ff" },
  { dark: "#9d174d", light: "#fecdd3" },
  { dark: "#0f172a", light: "#cbd5f5" },
  { dark: "#14532d", light: "#bef264" },
  { dark: "#92400e", light: "#fed7aa" },
];

// Server Component for critical topics data (featured topics)
async function FeaturedTopicsData() {
  let featuredTopics: any[] = [];

  try {
    featuredTopics = await getFeaturedTopics(6);
  } catch {
    // Fallback to empty data on error
  }

  const featuredItems = featuredTopics.map((topic, index) => ({
    id: topic.id,
    title: topic.name,
    description: topic.description,
    href: `/topics/${topic.slug}`,
    accentDark: colorPairs[index % colorPairs.length].dark,
    accentLight: colorPairs[index % colorPairs.length].light,
  }));

  return featuredItems;
}

// Server Component for all topics data
async function AllTopicsData() {
  let allTopics: any[] = [];
  let l2Topics: any[] = [];

  try {
    [allTopics, l2Topics] = await Promise.all([
      getRootTopics(),
      getL2TopicsForPopularSports(),
    ]);
  } catch {
    // Fallback to empty data on error
  }

  const allItems = allTopics.map((topic, index) => ({
    id: topic.id,
    title: topic.name,
    description: topic.description,
    href: `/topics/${topic.slug}`,
    accentDark: colorPairs[index % colorPairs.length].dark,
    accentLight: colorPairs[index % colorPairs.length].light,
    quizCount: topic._count.quizTopicConfigs,
  }));

  // Map L2 topics grouped by parent
  const l2ItemsByParent = l2Topics.reduce((acc, topic) => {
    const parentName = topic.parent.name;
    if (!acc[parentName]) {
      acc[parentName] = [];
    }
    acc[parentName].push({
      id: topic.id,
      title: topic.name,
      description: topic.description,
      href: `/topics/${topic.slug}`,
      accentDark: colorPairs[Object.keys(acc).length % colorPairs.length].dark,
      accentLight: colorPairs[Object.keys(acc).length % colorPairs.length].light,
      quizCount: topic._count.quizTopicConfigs,
      parentName: parentName,
      parentSlug: topic.parent.slug,
    });
    return acc;
  }, {} as Record<string, any[]>);

  return { allItems, l2ItemsByParent };
}

// Server Component for search suggestions
async function SearchSuggestionsData() {
  const session = await auth();
  const userId = session?.user?.id;
  let trendingTopicQueries: any[] = [];
  let recentTopicQueries: { query: string }[] = [];
  let allTopics: any[] = [];

  try {
    [trendingTopicQueries, allTopics] = await Promise.all([
      getTrendingSearchQueries(SearchContext.TOPIC, { limit: 8 }),
      getRootTopics(),
    ]);
    if (userId) {
      recentTopicQueries = await getRecentSearchQueriesForUser(userId, SearchContext.TOPIC, {
        limit: 4,
      });
    }
  } catch {
    // Unable to load search telemetry, continue without it
  }

  const formatChipLabel = (value: string) =>
    value
      .split(" ")
      .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
      .join(" ");

  const chipMap = new Map<string, { value: string; label: string }>();

  trendingTopicQueries.forEach((entry) => {
    const label = formatChipLabel(entry.query);
    chipMap.set(entry.query, { value: entry.query, label });
  });

  recentTopicQueries.forEach((entry) => {
    if (!chipMap.has(entry.query)) {
      const label = formatChipLabel(entry.query);
      chipMap.set(entry.query, { value: entry.query, label });
    }
  });

  if (chipMap.size === 0) {
    allTopics.slice(0, 6).forEach((topic) => {
      const key = topic.name.toLowerCase();
      chipMap.set(key, { value: topic.name, label: topic.name });
    });
  }

  return Array.from(chipMap.values()).slice(0, 8);
}

// Main Server Component for topics data
async function TopicsData() {
  const [featuredItems, { allItems, l2ItemsByParent }, suggestedChips] = await Promise.all([
    FeaturedTopicsData(),
    AllTopicsData(),
    SearchSuggestionsData(),
  ]);
  
  return (
    <TopicsContent 
      featured={featuredItems} 
      topics={allItems}
      l2TopicsByParent={l2ItemsByParent}
      suggestedChips={suggestedChips}
    />
  );
}

// Fallback for topics loading
function TopicsFallback() {
  return (
    <PageContainer className="py-8">
      <div className="mb-8">
        <div className="h-10 w-64 rounded bg-muted animate-pulse mb-4" />
        <div className="h-4 w-96 rounded bg-muted animate-pulse" />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <TopicCardSkeleton key={index} />
        ))}
      </div>
    </PageContainer>
  );
}

export default async function TopicsPage() {
  return (
    <ShowcaseThemeProvider>
      <Suspense fallback={<TopicsFallback />}>
        <TopicsData />
      </Suspense>
    </ShowcaseThemeProvider>
  );
}
