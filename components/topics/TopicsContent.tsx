"use client";

import { useEffect, useMemo, useState } from "react";
import { ShowcasePage } from "@/components/showcase/ShowcasePage";
import { ShowcaseSearchBar } from "@/components/showcase/ui/SearchBar";
import { ShowcaseTopicCarousel } from "@/components/quiz/ShowcaseTopicCarousel";
import { ShowcaseTopicCard } from "@/components/quiz/ShowcaseTopicCard";
import { Card } from "@/components/ui/card";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getTextColor, getGlassCard } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";

interface TopicItem {
  id: string;
  title: string;
  description: string | null;
  href: string;
  accentDark: string;
  accentLight: string;
  quizCount?: number;
  parentName?: string;
  parentSlug?: string;
}

interface TopicsContentProps {
  featured: TopicItem[];
  topics: TopicItem[];
  l2TopicsByParent: Record<string, TopicItem[]>;
  suggestedChips?: { value: string; label: string; emoji?: string }[];
}

interface TopicSearchPayload {
  topics: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    level: number;
    parent?: { name: string | null; slug: string | null } | null;
    _count?: { quizTopicConfigs?: number };
  }>;
  pagination: {
    page: number;
    pages: number;
    limit: number;
    total: number;
  };
}

const topicAccentPalette = [
  { dark: "#7c2d12", light: "#fde68a" },
  { dark: "#065f46", light: "#bbf7d0" },
  { dark: "#1e3a8a", light: "#bfdbfe" },
  { dark: "#7c3aed", light: "#e9d5ff" },
  { dark: "#9d174d", light: "#fecdd3" },
  { dark: "#0f172a", light: "#cbd5f5" },
  { dark: "#14532d", light: "#bef264" },
  { dark: "#92400e", light: "#fed7aa" },
];

export function TopicsContent({
  featured,
  topics,
  l2TopicsByParent,
  suggestedChips = [],
}: TopicsContentProps) {
  const { theme } = useShowcaseTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TopicItem[] | null>(null);
  const [searchMeta, setSearchMeta] = useState<TopicSearchPayload["pagination"] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const combinedQuery = useMemo(() => {
    const tokens = [searchQuery, ...activeChips].map((token) => token.trim()).filter(Boolean);
    return tokens.join(" ");
  }, [searchQuery, activeChips]);

  const chips = useMemo(
    () =>
      suggestedChips.map((chip) => ({
        ...chip,
        active: activeChips.includes(chip.value),
      })),
    [suggestedChips, activeChips]
  );

  useEffect(() => {
    const next = combinedQuery.trim();
    const timeout = setTimeout(() => setDebouncedQuery(next), 250);
    return () => clearTimeout(timeout);
  }, [combinedQuery]);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults(null);
      setSearchMeta(null);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    const fetchTopics = async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const response = await fetch(
          `/api/topics?search=${encodeURIComponent(debouncedQuery)}&limit=30`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Search failed with status ${response.status}`);
        }

        const json = await response.json();
        const payload: TopicSearchPayload = json.data;

        const mapped: TopicItem[] = payload.topics.map((topic, index) => {
          const palette = topicAccentPalette[index % topicAccentPalette.length];
          return {
            id: topic.id,
            title: topic.name,
            description: topic.description,
            href: `/topics/${topic.slug}`,
            accentDark: palette.dark,
            accentLight: palette.light,
            quizCount: topic._count?.quizTopicConfigs ?? 0,
            parentName: topic.parent?.name ?? undefined,
            parentSlug: topic.parent?.slug ?? undefined,
          };
        });

        setSearchResults(mapped);
        setSearchMeta(payload.pagination);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setSearchError((error as Error).message);
        setSearchResults([]);
        setSearchMeta({
          page: 1,
          pages: 0,
          limit: 30,
          total: 0,
        });
      } finally {
        setIsSearching(false);
      }
    };

    fetchTopics();
    return () => controller.abort();
  }, [debouncedQuery]);

  const hasActiveSearch = Boolean(debouncedQuery);
  const totalResults = hasActiveSearch
    ? searchMeta?.total ?? (searchResults?.length ?? 0)
    : topics.length;

  const filteredL2Topics = useMemo(() => {
    if (hasActiveSearch) return {};
    return l2TopicsByParent;
  }, [hasActiveSearch, l2TopicsByParent]);

  return (
    <ShowcasePage
      title="Sports Topics"
      subtitle="Explore trivia quizzes by sport and category. Find your favorite topics and discover new challenges."
      badge="BROWSE TOPICS"
      variant="vibrant"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Topics" }]}
    >
      <div className="space-y-12">
        {/* Search Section */}
        <ShowcaseSearchBar
          value={searchQuery}
          placeholder="Search topics, sports, or categories..."
          actionLabel="Search"
          chips={chips}
          onValueChange={setSearchQuery}
          onSubmit={(value) => setSearchQuery(value)}
          onChipToggle={(chip, active) => {
            setActiveChips((prev) =>
              active ? [...prev, chip.value] : prev.filter((c) => c !== chip.value)
            );
          }}
        />

        {hasActiveSearch ? (
          <section className="space-y-6">
            <div className="text-center">
              <h2 className={cn("text-2xl font-bold mb-2", getTextColor(theme, "primary"))}>
                {totalResults > 0
                  ? `Search Results (${totalResults.toLocaleString()})`
                  : "No topics found"}
              </h2>
              <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
                {totalResults > 0
                  ? `Showing ${searchResults?.length ?? 0} of ${totalResults.toLocaleString()} matches for “${debouncedQuery}”`
                  : `Nothing matched “${debouncedQuery}”. Try another team, sport, or league.`}
              </p>
            </div>

            {isSearching ? (
              <Card className={cn("p-12 text-center", getGlassCard(theme))}>
                <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
                  Searching the topic catalog…
                </p>
              </Card>
            ) : searchError ? (
              <Card className={cn("p-12 text-center", getGlassCard(theme))}>
                <div className="space-y-3">
                  <h3 className={cn("text-xl font-semibold", getTextColor(theme, "primary"))}>
                    We hit a snag
                  </h3>
                  <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
                    {searchError}
                  </p>
                </div>
              </Card>
            ) : (searchResults?.length ?? 0) > 0 ? (
              <div className="flex flex-wrap justify-center gap-6">
                {searchResults!.map((topic) => (
                  <ShowcaseTopicCard
                    key={topic.id}
                    title={topic.title}
                    description={topic.description || "Explore quizzes in this category"}
                    href={topic.href}
                    accentDark={topic.accentDark}
                    accentLight={topic.accentLight}
                    variant={theme}
                  />
                ))}
              </div>
            ) : (
              <Card className={cn("p-12 text-center", getGlassCard(theme))}>
                <div className="space-y-4">
                  <div className="text-6xl">🔍</div>
                  <h3 className={cn("text-xl font-semibold", getTextColor(theme, "primary"))}>
                    No topics found
                  </h3>
                  <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
                    Try searching for different keywords or browse all topics above.
                  </p>
                </div>
              </Card>
            )}
          </section>
        ) : (
          <>
            {/* Featured Topics */}
            {featured.length > 0 && (
              <section className="space-y-6">
                <div className="text-center">
                  <h2 className={cn("text-2xl font-bold mb-2", getTextColor(theme, "primary"))}>
                    Featured Topics
                  </h2>
                  <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
                    Popular sports categories with the most engaging quizzes
                  </p>
                </div>
                <ShowcaseTopicCarousel items={featured} variant={theme} />
              </section>
            )}

            {/* All Topics Grid */}
            <section className="space-y-6">
              <div className="text-center">
                <h2 className={cn("text-2xl font-bold mb-2", getTextColor(theme, "primary"))}>
                  All Sports ({topics.length})
                </h2>
                <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
                  Browse all available sports categories
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-6">
                {topics.map((topic) => (
                  <ShowcaseTopicCard
                    key={topic.id}
                    title={topic.title}
                    description={topic.description || "Explore quizzes in this category"}
                    href={topic.href}
                    accentDark={topic.accentDark}
                    accentLight={topic.accentLight}
                    variant={theme}
                  />
                ))}
              </div>
            </section>

            {/* Subcategories */}
            {Object.keys(filteredL2Topics).length > 0 && (
              <section className="space-y-8">
                <div className="text-center">
                  <h2 className={cn("text-2xl font-bold mb-2", getTextColor(theme, "primary"))}>
                    Specialized Categories
                  </h2>
                  <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
                    Dive deeper into specific areas within each sport
                  </p>
                </div>

                {Object.entries(filteredL2Topics).map(([parentName, l2Topics]) => (
                  <div key={parentName} className="space-y-4">
                    <h3 className={cn("text-lg font-semibold", getTextColor(theme, "primary"))}>
                      {parentName} Subcategories
                    </h3>
                    <div className="flex flex-wrap justify-center gap-4">
                      {l2Topics.slice(0, 8).map((topic) => (
                        <ShowcaseTopicCard
                          key={topic.id}
                          title={topic.title}
                          description={topic.description || "Specialized quizzes"}
                          href={topic.href}
                          accentDark={topic.accentDark}
                          accentLight={topic.accentLight}
                          variant={theme}
                          className="h-[180px] w-[280px]"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </div>
    </ShowcasePage>
  );
}
