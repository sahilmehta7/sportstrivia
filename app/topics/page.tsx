import type { Metadata } from "next";
import { SearchContext } from "@prisma/client";
import { auth } from "@/lib/auth";
import { getRootTopics, getFeaturedTopics, getL2TopicsForPopularSports } from "@/lib/services/topic.service";
import {
  getRecentSearchQueriesForUser,
  getTrendingSearchQueries,
} from "@/lib/services/search-query.service";
import { TopicsContent } from "@/components/topics/TopicsContent";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";

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

export default async function TopicsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  let featuredTopics = [];
  let allTopics = [];
  let l2Topics = [];
  let trendingTopicQueries = [];
  let recentTopicQueries: { query: string }[] = [];

  try {
    [featuredTopics, allTopics, l2Topics] = await Promise.all([
      getFeaturedTopics(6),
      getRootTopics(),
      getL2TopicsForPopularSports(),
    ]);
  } catch (error) {
    console.warn("[topics] Falling back to empty data due to fetch error", error);
  }

  try {
    trendingTopicQueries = await getTrendingSearchQueries(SearchContext.TOPIC, { limit: 8 });
    if (userId) {
      recentTopicQueries = await getRecentSearchQueriesForUser(userId, SearchContext.TOPIC, {
        limit: 4,
      });
    }
  } catch (error) {
    console.warn("[topics] Unable to load search telemetry", error);
  }
  
  // Map root topics to format with color pairs
  const featuredItems = featuredTopics.map((topic, index) => ({
    id: topic.id,
    title: topic.name,
    description: topic.description,
    href: `/topics/${topic.slug}`,
    accentDark: colorPairs[index % colorPairs.length].dark,
    accentLight: colorPairs[index % colorPairs.length].light,
  }));

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

  const searchChips = Array.from(chipMap.values()).slice(0, 8);
  
  return (
    <ShowcaseThemeProvider>
      <TopicsContent 
        featured={featuredItems} 
        topics={allItems}
        l2TopicsByParent={l2ItemsByParent}
        suggestedChips={searchChips}
      />
    </ShowcaseThemeProvider>
  );
}
