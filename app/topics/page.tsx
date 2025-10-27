import type { Metadata } from "next";
import { getRootTopics, getFeaturedTopics, getL2TopicsForPopularSports } from "@/lib/services/topic.service";
import TopicsBrowse from "@/components/topics/TopicsBrowse";
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
  let featuredTopics = [];
  let allTopics = [];
  let l2Topics = [];

  try {
    [featuredTopics, allTopics, l2Topics] = await Promise.all([
      getFeaturedTopics(6),
      getRootTopics(),
      getL2TopicsForPopularSports(),
    ]);
  } catch (error) {
    console.warn("[topics] Falling back to empty data due to fetch error", error);
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
  
  return (
    <ShowcaseThemeProvider>
      <TopicsBrowse 
        featured={featuredItems} 
        topics={allItems}
        l2TopicsByParent={l2ItemsByParent}
      />
    </ShowcaseThemeProvider>
  );
}
