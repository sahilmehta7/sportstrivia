import { getRootTopics, getFeaturedTopics } from "@/lib/services/topic.service";
import TopicsBrowse from "@/components/topics/TopicsBrowse";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";

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
  const [featuredTopics, allTopics] = await Promise.all([
    getFeaturedTopics(6),
    getRootTopics()
  ]);
  
  // Map topics to format with color pairs for the components
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
  
  return (
    <ShowcaseThemeProvider>
      <TopicsBrowse featured={featuredItems} topics={allItems} />
    </ShowcaseThemeProvider>
  );
}
