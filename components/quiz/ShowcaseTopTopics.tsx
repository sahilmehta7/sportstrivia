"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { Users, BookOpen, TrendingUp, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { TopicSummary } from "@/types/home";

interface TopTopicsResponse {
  topics: TopicSummary[];
  sortBy: string;
  limit: number;
  total: number;
}

interface ShowcaseTopTopicsProps {
  title?: string;
  showViewAll?: boolean;
  viewAllHref?: string;
  defaultSortBy?: "users" | "quizzes";
  limit?: number;
  className?: string;
  initialTopics?: TopicSummary[];
}

// Topic icons mapping
const topicIcons: Record<string, string> = {
  "Mathematics": "📐",
  "Science": "🧪",
  "Drama": "🎭",
  "Art & Craft": "🎨",
  "Knowledge": "📚",
  "Language": "🗣️",
  "Sports": "⚽",
  "History": "🏛️",
  "Geography": "🌍",
  "Music": "🎵",
  "Literature": "📖",
  "Technology": "💻",
  "Biology": "🧬",
  "Chemistry": "⚗️",
  "Physics": "⚛️",
  "default": "📝",
};

// Color pairs for topic backgrounds (matching showcase topic cards)
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

export function ShowcaseTopTopics({
  title = "Top Quiz Categories",
  showViewAll = true,
  viewAllHref = "/topics",
  defaultSortBy = "users",
  limit = 6,
  className,
  initialTopics,
}: ShowcaseTopTopicsProps) {
  const { theme } = useShowcaseTheme();
  const initialTopicsProvided = Array.isArray(initialTopics) && initialTopics.length > 0;
  const [topics, setTopics] = useState<TopicSummary[]>(initialTopics ?? []);
  const [sortBy, setSortBy] = useState<"users" | "quizzes">(defaultSortBy);
  const [loading, setLoading] = useState(!initialTopicsProvided);
  const [error, setError] = useState<string | null>(null);
  const hydratedInitialRef = useRef(false);

  useEffect(() => {
    if (!hydratedInitialRef.current) {
      hydratedInitialRef.current = true;
      if (initialTopicsProvided && sortBy === defaultSortBy) {
        setLoading(false);
        setError(null);
        return;
      }
    }

    let ignore = false;
    const fetchTopTopics = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/topics/top?sortBy=${sortBy}&limit=${limit}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch topics: ${response.statusText}`);
        }

        const data: TopTopicsResponse = await response.json();
        if (!ignore) {
          setTopics(data.topics ?? []);
        }
      } catch (err) {
        console.error("Error fetching top topics:", err);
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to fetch topics");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    void fetchTopTopics();

    return () => {
      ignore = true;
    };
  }, [sortBy, limit, defaultSortBy, initialTopicsProvided]);

  const getTopicIcon = (topicName: string) => {
    return topicIcons[topicName] || topicIcons.default;
  };

  const getSortLabel = (sort: "users" | "quizzes") => {
    return sort === "users" ? "Most Active Users" : "Most Quizzes";
  };

  if (loading) {
    return (
      <div className={cn("w-full max-w-6xl mx-auto", className)}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className={cn("ml-2 text-sm", getTextColor(theme, "secondary"))}>
            Loading top topics...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("w-full max-w-6xl mx-auto", className)}>
        <Card className={cn("p-6 text-center", getGlassCard(theme))}>
          <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
            Error: {error}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("w-full max-w-6xl mx-auto space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={cn("text-2xl font-bold", getTextColor(theme, "primary"))}>
            {title}
          </h2>
          <p className={cn("text-sm mt-1", getTextColor(theme, "secondary"))}>
            {getSortLabel(sortBy)} in the last 30 days
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Sort Selector */}
          <Select value={sortBy} onValueChange={(value: "users" | "quizzes") => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="users">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Most Users
                </div>
              </SelectItem>
              <SelectItem value="quizzes">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Most Quizzes
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          {/* View All Button */}
          {showViewAll && (
            <Button asChild variant="outline" size="sm">
              <Link href={viewAllHref}>
                View All
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {topics.map((topic, index) => {
          const colorPair = colorPairs[index % colorPairs.length];
          const accentColor = theme === "light" ? colorPair.light : colorPair.dark;
          
          return (
            <Card key={topic.id} className={cn("group cursor-pointer transition-all duration-200 hover:scale-105 overflow-hidden", getGlassCard(theme))}>
              <Link href={`/topics/${topic.slug}`}>
                <CardContent className="p-0">
                  {/* Background Section with Accent Color */}
                  <div 
                    className="p-6 text-center space-y-4"
                    style={{ backgroundColor: accentColor }}
                  >
                    {/* Topic Icon */}
                    <div className="flex justify-center">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-200 group-hover:scale-110 backdrop-blur-sm",
                        theme === "light" 
                          ? "bg-white/80 shadow-lg shadow-black/10" 
                          : "bg-black/20 shadow-lg shadow-black/30"
                      )}>
                        {topic.imageUrl ? (
                          <Image
                            src={topic.imageUrl}
                            alt={topic.name}
                            width={48}
                            height={48}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <span className="text-3xl">{getTopicIcon(topic.name)}</span>
                        )}
                      </div>
                    </div>

                    {/* Topic Name */}
                    <div>
                      <h3 className={cn(
                        "font-semibold text-lg group-hover:underline",
                        theme === "light" 
                          ? "text-slate-900 drop-shadow-[0_2px_8px_rgba(0,0,0,0.1)]" 
                          : "text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                      )}>
                        {topic.name}
                      </h3>
                      {topic.description && (
                        <p className={cn(
                          "text-xs mt-1 line-clamp-2",
                          theme === "light" 
                            ? "text-slate-700" 
                            : "text-white/80"
                        )}>
                          {topic.description}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-center gap-4 text-xs">
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm",
                        theme === "light" 
                          ? "bg-white/60 text-slate-700" 
                          : "bg-black/30 text-white/80"
                      )}>
                        <Users className="h-3 w-3" />
                        <span>
                          {sortBy === "users" ? topic.userCount : topic.quizCount}
                        </span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm",
                        theme === "light" 
                          ? "bg-white/60 text-slate-700" 
                          : "bg-black/30 text-white/80"
                      )}>
                        <BookOpen className="h-3 w-3" />
                        <span>
                          {topic.quizCount}
                        </span>
                      </div>
                    </div>

                    {/* Trending Badge */}
                    {sortBy === "users" && topic.userCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs backdrop-blur-sm",
                          theme === "light" 
                            ? "bg-emerald-100/80 text-emerald-700 border-emerald-200/50" 
                            : "bg-emerald-900/50 text-emerald-300 border-emerald-700/50"
                        )}
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {topics.length === 0 && (
        <Card className={cn("p-12 text-center", getGlassCard(theme))}>
          <div className="space-y-4">
            <div className="text-4xl">📝</div>
            <h3 className={cn("text-lg font-semibold", getTextColor(theme, "primary"))}>
              No topics found
            </h3>
            <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
              Try adjusting your sorting criteria or check back later.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
