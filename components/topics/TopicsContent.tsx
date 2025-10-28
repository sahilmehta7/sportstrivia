"use client";

import { useState, useMemo } from "react";
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
}

export function TopicsContent({ featured, topics, l2TopicsByParent }: TopicsContentProps) {
  const { theme } = useShowcaseTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChips, setActiveChips] = useState<string[]>([]);

  // Search chips for topic categories
  const searchChips = [
    { value: "football", label: "Football", emoji: "⚽", active: activeChips.includes("football") },
    { value: "basketball", label: "Basketball", emoji: "🏀", active: activeChips.includes("basketball") },
    { value: "cricket", label: "Cricket", emoji: "🏏", active: activeChips.includes("cricket") },
    { value: "tennis", label: "Tennis", emoji: "🎾", active: activeChips.includes("tennis") },
  ];

  const filteredTopics = useMemo(() => {
    let filtered = topics;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(topic => 
        topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by active chips
    if (activeChips.length > 0) {
      filtered = filtered.filter(topic => 
        activeChips.some(chip => 
          topic.title.toLowerCase().includes(chip.toLowerCase())
        )
      );
    }
    
    return filtered;
  }, [searchQuery, topics, activeChips]);

  const filteredL2Topics = useMemo(() => {
    if (!searchQuery && activeChips.length === 0) return l2TopicsByParent;
    
    const filtered: Record<string, TopicItem[]> = {};
    Object.entries(l2TopicsByParent).forEach(([parentName, l2Topics]) => {
      let matchingTopics = l2Topics;
      
      // Filter by search query
      if (searchQuery) {
        matchingTopics = matchingTopics.filter(topic => 
          topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          topic.description?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Filter by active chips
      if (activeChips.length > 0) {
        matchingTopics = matchingTopics.filter(topic => 
          activeChips.some(chip => 
            topic.title.toLowerCase().includes(chip.toLowerCase()) ||
            parentName.toLowerCase().includes(chip.toLowerCase())
          )
        );
      }
      
      if (matchingTopics.length > 0) {
        filtered[parentName] = matchingTopics;
      }
    });
    return filtered;
  }, [searchQuery, l2TopicsByParent, activeChips]);

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
          chips={searchChips}
          onValueChange={setSearchQuery}
          onSubmit={(value) => setSearchQuery(value)}
          onChipToggle={(chip, active) => {
            setActiveChips(prev => 
              active 
                ? [...prev, chip.value]
                : prev.filter(c => c !== chip.value)
            );
          }}
        />

        {/* Featured Topics */}
        {!searchQuery && activeChips.length === 0 && featured.length > 0 && (
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
        {filteredTopics.length > 0 && (
          <section className="space-y-6">
            <div className="text-center">
              <h2 className={cn("text-2xl font-bold mb-2", getTextColor(theme, "primary"))}>
                {searchQuery || activeChips.length > 0 ? `Search Results (${filteredTopics.length})` : "All Sports"}
              </h2>
              <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
                {searchQuery || activeChips.length > 0
                  ? `Topics matching your search${activeChips.length > 0 ? ` and filters` : ""}`
                  : "Browse all available sports categories"
                }
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              {filteredTopics.map((topic) => (
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
        )}

        {/* Subcategories */}
        {!searchQuery && activeChips.length === 0 && Object.keys(l2TopicsByParent).length > 0 && (
          <section className="space-y-8">
            <div className="text-center">
              <h2 className={cn("text-2xl font-bold mb-2", getTextColor(theme, "primary"))}>
                Specialized Categories
              </h2>
              <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
                Dive deeper into specific areas within each sport
              </p>
            </div>

            {Object.entries(l2TopicsByParent).map(([parentName, l2Topics]) => (
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

        {/* Filtered L2 Topics for Search */}
        {(searchQuery || activeChips.length > 0) && Object.keys(filteredL2Topics).length > 0 && (
          <section className="space-y-6">
            <div className="text-center">
              <h2 className={cn("text-2xl font-bold mb-2", getTextColor(theme, "primary"))}>
                Specialized Categories
              </h2>
              <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
                Subcategories matching your search
              </p>
            </div>

            {Object.entries(filteredL2Topics).map(([parentName, l2Topics]) => (
              <div key={parentName} className="space-y-4">
                <h3 className={cn("text-lg font-semibold", getTextColor(theme, "primary"))}>
                  {parentName}
                </h3>
                <div className="flex flex-wrap justify-center gap-4">
                  {l2Topics.map((topic) => (
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

        {/* No Results */}
        {(searchQuery || activeChips.length > 0) && filteredTopics.length === 0 && Object.keys(filteredL2Topics).length === 0 && (
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
      </div>
    </ShowcasePage>
  );
}
