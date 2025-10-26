"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor, getAccentColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { Users, BookOpen, TrendingUp, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface TopTopic {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  userCount: number;
  quizCount: number;
}

interface TopTopicsResponse {
  topics: TopTopic[];
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

export function ShowcaseTopTopics({
  title = "Top Quiz Categories",
  showViewAll = true,
  viewAllHref = "/topics",
  defaultSortBy = "users",
  limit = 6,
  className,
}: ShowcaseTopTopicsProps) {
  const { theme } = useShowcaseTheme();
  const [topics, setTopics] = useState<TopTopic[]>([]);
  const [sortBy, setSortBy] = useState<"users" | "quizzes">(defaultSortBy);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopTopics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/topics/top?sortBy=${sortBy}&limit=${limit}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch topics: ${response.statusText}`);
        }
        
        const data: TopTopicsResponse = await response.json();
        setTopics(data.topics);
      } catch (err) {
        console.error("Error fetching top topics:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch topics");
      } finally {
        setLoading(false);
      }
    };

    fetchTopTopics();
  }, [sortBy, limit]);

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
        {topics.map((topic) => (
          <Card key={topic.id} className={cn("group cursor-pointer transition-all duration-200 hover:scale-105", getGlassCard(theme))}>
            <Link href={`/topics/${topic.slug}`}>
              <CardContent className="p-6 text-center space-y-4">
                {/* Topic Icon */}
                <div className="flex justify-center">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-200 group-hover:scale-110",
                    theme === "light" 
                      ? "bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg shadow-blue-100/50" 
                      : "bg-gradient-to-br from-blue-900/50 to-purple-900/50 shadow-lg shadow-blue-500/20"
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
                  <h3 className={cn("font-semibold text-lg group-hover:underline", getTextColor(theme, "primary"))}>
                    {topic.name}
                  </h3>
                  {topic.description && (
                    <p className={cn("text-xs mt-1 line-clamp-2", getTextColor(theme, "secondary"))}>
                      {topic.description}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span className={getTextColor(theme, "muted")}>
                      {sortBy === "users" ? topic.userCount : topic.quizCount}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    <span className={getTextColor(theme, "muted")}>
                      {topic.quizCount}
                    </span>
                  </div>
                </div>

                {/* Trending Badge */}
                {sortBy === "users" && topic.userCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-xs",
                      theme === "light" 
                        ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                        : "bg-emerald-900/50 text-emerald-300 border-emerald-700/50"
                    )}
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending
                  </Badge>
                )}
              </CardContent>
            </Link>
          </Card>
        ))}
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
