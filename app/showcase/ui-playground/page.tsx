import { prisma } from "@/lib/db";
import type { ShowcaseFilterGroup } from "@/components/showcase/ui/FilterBar";
import { ShowcaseUiPlaygroundContent } from "./ShowcaseUiPlaygroundContent";

async function getFilterGroups(): Promise<ShowcaseFilterGroup[]> {
  // Fetch topics from the database where parentId is null (level 1 sports)
  const topics = await prisma.topic.findMany({
    where: {
      parentId: null,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Map topics to filter options with emojis
  const sportEmojiMap: Record<string, string> = {
    "Cricket": "🏏",
    "Football": "⚽",
    "Basketball": "🏀",
    "Tennis": "🎾",
    "Formula 1": "🏎️",
    "Olympics": "🏅",
    "Rugby": "🏉",
    "Golf": "⛳",
    "Baseball": "⚾",
    "Hockey": "🏒",
  };

  const categoryOptions = [
    { value: "all", label: "All Sports" },
    ...topics.map((topic) => ({
      value: topic.slug,
      label: topic.name,
      emoji: sportEmojiMap[topic.name] || "🏆",
    })),
  ];

  return [
    {
      id: "category",
      label: "Category",
      options: categoryOptions,
      activeValue: "all",
    },
    {
      id: "difficulty",
      label: "Difficulty",
      type: "select",
      options: [
        { value: "all", label: "All levels" },
        { value: "easy", label: "Easy" },
        { value: "medium", label: "Medium" },
        { value: "hard", label: "Hard" },
      ],
      activeValue: "all",
    },
  ];
}

export default async function ShowcaseUiPlaygroundPage() {
  const filterGroups = await getFilterGroups();

  return <ShowcaseUiPlaygroundContent filterGroups={filterGroups} />;
}
