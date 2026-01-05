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
import { motion } from "framer-motion";

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


  // Special sections derived from popular topics for the Bento Grid
  // We'll prioritize Cricket and Football if they exist, or just take the first few
  const bentoTopics = useMemo(() => {
    if (hasActiveSearch) return [];

    // Flatten L2 topics to find interesting ones or use top-level topics
    const sportCategories = Object.entries(l2TopicsByParent).map(([parent, items]) => ({
      title: parent,
      items: items.slice(0, 4), // Top 4 subcategories
      count: items.length
    })).sort((a, b) => b.count - a.count); // Sort by number of subtopics

    return sportCategories;
  }, [hasActiveSearch, l2TopicsByParent]);

  return (
    <ShowcasePage
      title="Sports Topics"
      subtitle="Explore trivia quizzes by sport and category. Find your favorite topics and discover new challenges."
      badge="BROWSE TOPICS"
      variant="vibrant"
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Topics" }]}
    >
      <div className="space-y-16 lg:space-y-24">
        {/* Search Section */}
        <div className="mx-auto max-w-3xl">
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
        </div>

        {hasActiveSearch ? (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <h2 className={cn("text-3xl font-bold mb-3", getTextColor("primary"))}>
                {totalResults > 0
                  ? `Search Results`
                  : "No topics found"}
              </h2>
              <p className={cn("text-lg opacity-80", getTextColor("secondary"))}>
                {totalResults > 0
                  ? `Found ${totalResults.toLocaleString()} matches for “${debouncedQuery}”`
                  : `Nothing matched “${debouncedQuery}”. Try another team, sport, or league.`}
              </p>
            </div>

            {isSearching ? (
              <Card className={cn("p-16 text-center border-none shadow-2xl", getGlassCard())}>
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-current border-t-transparent opacity-50" />
                  <p className={cn("text-lg font-medium", getTextColor("secondary"))}>
                    Searching catalog...
                  </p>
                </div>
              </Card>
            ) : searchError ? (
              <Card className={cn("p-12 text-center", getGlassCard())}>
                <div className="space-y-3">
                  <h3 className={cn("text-xl font-semibold", getTextColor("primary"))}>
                    We hit a snag
                  </h3>
                  <p className={cn("text-sm", getTextColor("secondary"))}>
                    {searchError}
                  </p>
                </div>
              </Card>
            ) : (searchResults?.length ?? 0) > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults!.map((topic, idx) => (
                  <motion.div
                    key={topic.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <ShowcaseTopicCard
                      title={topic.title}
                      description={topic.description || "Explore quizzes in this category"}
                      href={topic.href}
                      accentDark={topic.accentDark}
                      accentLight={topic.accentLight}
                      variant={theme}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className={cn("p-16 text-center border-none shadow-xl", getGlassCard())}>
                <div className="space-y-6">
                  <div className="text-7xl">🔍</div>
                  <div className="space-y-2">
                    <h3 className={cn("text-2xl font-bold", getTextColor("primary"))}>
                      No topics found
                    </h3>
                    <p className={cn("text-lg", getTextColor("secondary"))}>
                      Try searching for different keywords or browse all topics below.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </section>
        ) : (
          <div className="space-y-20 lg:space-y-24">
            {/* Featured Topics Carousel */}
            {featured.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                    <h2 className={cn("text-2xl font-bold tracking-tight", getTextColor("primary"))}>
                      Featured Collections
                    </h2>
                    <p className={cn("text-sm opacity-70", getTextColor("secondary"))}>
                      Curated top picks for you
                    </p>
                  </div>
                </div>
                <div className="-mx-4 sm:mx-0">
                  <ShowcaseTopicCarousel items={featured} variant={theme} />
                </div>
              </section>
            )}

            {/* Popular Categories Bento Grid */}
            {bentoTopics.length > 0 && (
              <section className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className={cn("text-3xl font-black uppercase tracking-tight", getTextColor("primary"))}>
                    Popular Categories
                  </h2>
                  <p className={cn("text-lg max-w-2xl mx-auto opacity-70", getTextColor("secondary"))}>
                    Deep dive into major sports and their subcategories
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {bentoTopics.slice(0, 6).map((sport, idx) => (
                    <Card
                      key={sport.title}
                      className={cn(
                        "overflow-hidden border-0 p-6 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl",
                        getGlassCard(),
                        idx === 0 ? "md:col-span-2 xl:col-span-1" : "" // Make first item span on medium screens for bento feel
                      )}
                    >
                      <div className="flex flex-col h-full">
                        <h3 className={cn("text-2xl font-bold mb-4", getTextColor("primary"))}>
                          {sport.title}
                        </h3>
                        <div className="grid grid-cols-1 gap-3 mb-4 flex-grow">
                          {sport.items.map(item => (
                            <a
                              key={item.id}
                              href={item.href}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg transition-colors",
                                theme === 'light' ? "hover:bg-black/5 bg-black/5" : "hover:bg-white/10 bg-white/5"
                              )}
                            >
                              <span className={cn("font-medium", getTextColor("primary"))}>{item.title}</span>
                              <span className={cn("text-xs px-2 py-1 rounded-full bg-black/10 dark:bg-white/10 opacity-70", getTextColor("secondary"))}>
                                View
                              </span>
                            </a>
                          ))}
                        </div>
                        <a
                          href={`/topics/${sport.items[0]?.parentSlug || ''}`}
                          className={cn(
                            "text-sm font-semibold mt-auto inline-flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity",
                            getTextColor("primary")
                          )}
                        >
                          View all {sport.title} topics →
                        </a>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* All Topics Grid */}
            <section className="space-y-8">
              <div className="flex items-end justify-between border-b pb-4 border-white/10">
                <div className="space-y-1">
                  <h2 className={cn("text-2xl font-bold tracking-tight", getTextColor("primary"))}>
                    All Sports
                  </h2>
                  <p className={cn("text-sm opacity-70", getTextColor("secondary"))}>
                    From Archery to Wrestling, find it here
                  </p>
                </div>
                <div className={cn("text-sm font-medium opacity-50", getTextColor("primary"))}>
                  {topics.length} Sports
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {topics.map((topic) => (
                  <a
                    key={topic.id}
                    href={topic.href}
                    className={cn(
                      "group relative flex flex-col items-center justify-center p-6 text-center rounded-2xl transition-all duration-300",
                      theme === 'light'
                        ? "bg-white hover:shadow-lg hover:-translate-y-1 border border-slate-100"
                        : "bg-white/5 hover:bg-white/10 hover:shadow-xl hover:-translate-y-1 border border-white/5"
                    )}
                  >
                    <div
                      className="mb-3 h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${topic.accentDark} 0%, ${topic.accentDark}80 100%)`,
                        color: topic.accentLight
                      }}
                    >
                      {topic.title.charAt(0)}
                    </div>
                    <h3 className={cn("font-semibold text-sm line-clamp-2", getTextColor("primary"))}>
                      {topic.title}
                    </h3>
                    {topic.quizCount !== undefined && (
                      <span className={cn("mt-2 text-xs opacity-50", getTextColor("secondary"))}>
                        {topic.quizCount} Quizzes
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </ShowcasePage>
  );
}
