"use client";

import { useState } from "react";
import { ShowcaseQuizCard } from "./ShowcaseQuizCard";
import { ShowcaseQuizCarousel } from "./ShowcaseQuizCarousel";
import { ShowcaseDailyStreak } from "./ShowcaseDailyStreak";
import { ShowcaseLeaderboard } from "./ShowcaseLeaderboard";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getGlassCard, getTextColor, getAccentColor } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Star, Users, Search, Filter, SortAsc, SortDesc } from "lucide-react";
import type { PublicQuizListResponse, PublicQuizFilterOptions, PublicQuizFilters } from "@/lib/services/public-quiz.service";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";
import { Difficulty } from "@prisma/client";

interface ShowcaseQuizListingProps {
  listing: PublicQuizListResponse;
  filterOptions: PublicQuizFilterOptions;
  appliedFilters: PublicQuizFilters;
  featuredQuizzes: PublicQuizListItem[];
  dailyQuizzes: any[];
  comingSoonQuizzes: any[];
}

const difficultyColors: Record<Difficulty, string> = {
  EASY: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  HARD: "bg-rose-500/10 text-rose-600 border border-rose-500/30",
};

function formatDuration(duration?: number | null) {
  if (!duration) return "Flexible";
  const minutes = Math.max(1, Math.round(duration / 60));
  return `${minutes} min${minutes === 1 ? "" : "s"}`;
}

export function ShowcaseQuizListing({
  listing,
  filterOptions,
  appliedFilters,
  featuredQuizzes,
  dailyQuizzes,
  comingSoonQuizzes,
}: ShowcaseQuizListingProps) {
  const { theme } = useShowcaseTheme();
  const [searchQuery, setSearchQuery] = useState(appliedFilters.search || "");
  const [selectedSport, setSelectedSport] = useState(appliedFilters.sport || "all");
  const [selectedDifficulty, setSelectedDifficulty] = useState(appliedFilters.difficulty || "all");
  const [sortBy, setSortBy] = useState(appliedFilters.sortBy || "createdAt");
  const [sortOrder, setSortOrder] = useState(appliedFilters.sortOrder || "desc");

  // Convert quizzes to carousel format
  const carouselItems = featuredQuizzes.map((quiz, index) => ({
    id: quiz.id,
    title: quiz.title,
    badgeLabel: quiz.sport || quiz.difficulty || "Featured",
    durationLabel: formatDuration(quiz.duration),
    playersLabel: `${quiz._count?.attempts || 0} players`,
    accent: `from-blue-500 to-purple-600`,
    coverImageUrl: quiz.descriptionImageUrl,
  }));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Featured Quizzes Hero */}
      {featuredQuizzes.length > 0 && (
        <section className="space-y-6">
          <div className="text-center">
            <h2 className={cn("text-2xl font-bold mb-2", getTextColor(theme, "primary"))}>
              Featured Quizzes
            </h2>
            <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
              Handpicked quizzes to get you started
            </p>
          </div>
          <ShowcaseQuizCarousel items={carouselItems} />
        </section>
      )}

      {/* Daily Streak Section */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className={cn("text-2xl font-bold mb-2", getTextColor(theme, "primary"))}>
            Daily Challenge
          </h2>
          <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
            Keep your streak alive with daily quizzes
          </p>
        </div>
        <div className="flex justify-center">
          <ShowcaseDailyStreak
            currentStreak={7}
            bestStreak={15}
            completedDays={[1, 2, 3, 4, 5, 6, 7]}
            message="You're on fire! 🔥"
          />
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className={cn("text-2xl font-bold mb-2", getTextColor(theme, "primary"))}>
            Global Leaderboard
          </h2>
          <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
            See how you stack up against other players
          </p>
        </div>
        <div className="flex justify-center">
          <ShowcaseLeaderboard
            title="Global Rankings"
            datasets={{
              daily: [
                { id: "1", name: "Alex Johnson", score: 95, position: 1, avatarUrl: null },
                { id: "2", name: "Sarah Wilson", score: 92, position: 2, avatarUrl: null },
                { id: "3", name: "Mike Chen", score: 89, position: 3, avatarUrl: null },
              ],
              "all-time": [
                { id: "1", name: "Alex Johnson", score: 98, position: 1, avatarUrl: null },
                { id: "2", name: "Sarah Wilson", score: 95, position: 2, avatarUrl: null },
                { id: "3", name: "Mike Chen", score: 92, position: 3, avatarUrl: null },
              ],
            }}
            initialRange="daily"
          />
        </div>
      </section>

      {/* Filter Bar */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className={cn("text-2xl font-bold mb-2", getTextColor(theme, "primary"))}>
            Advanced Filtering
          </h2>
          <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
            Find the perfect quiz with our powerful filters
          </p>
        </div>
        
        <Card className={cn("p-6", getGlassCard(theme))}>
          <CardHeader>
            <CardTitle className={cn("flex items-center gap-2", getTextColor(theme, "primary"))}>
              <Filter className="h-5 w-5" />
              Filter & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", getTextColor(theme, "secondary"))}>
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search quizzes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Sport Filter */}
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", getTextColor(theme, "secondary"))}>
                  Sport
                </label>
                <Select value={selectedSport} onValueChange={setSelectedSport}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Sports" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    {filterOptions.sports.map((sport) => (
                      <SelectItem key={sport} value={sport}>
                        {sport}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Filter */}
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", getTextColor(theme, "secondary"))}>
                  Difficulty
                </label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {Object.values(Difficulty).map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Options */}
              <div className="space-y-2">
                <label className={cn("text-sm font-medium", getTextColor(theme, "secondary"))}>
                  Sort By
                </label>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt">Date</SelectItem>
                      <SelectItem value="popularity">Popularity</SelectItem>
                      <SelectItem value="rating">Rating</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  >
                    {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedSport && selectedSport !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Sport: {selectedSport}
                  <button
                    onClick={() => setSelectedSport("all")}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedDifficulty && selectedDifficulty !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Difficulty: {selectedDifficulty}
                  <button
                    onClick={() => setSelectedDifficulty("all")}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quiz Grid */}
      <section className="space-y-6">
        <div className="text-center">
          <h2 className={cn("text-2xl font-bold mb-2", getTextColor(theme, "primary"))}>
            Quiz Collection
          </h2>
          <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
            {listing.pagination.total} quizzes available
          </p>
        </div>

        {listing.quizzes.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listing.quizzes.map((quiz) => (
              <Card key={quiz.id} className={cn("overflow-hidden", getGlassCard(theme))}>
                <div className="relative aspect-video">
                  {quiz.descriptionImageUrl ? (
                    <img
                      src={quiz.descriptionImageUrl}
                      alt={quiz.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={cn("w-full h-full flex items-center justify-center", 
                      theme === "light" ? "bg-gradient-to-br from-blue-100 to-purple-100" : "bg-gradient-to-br from-blue-900 to-purple-900"
                    )}>
                      <span className="text-4xl">⚽</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={difficultyColors[quiz.difficulty]}>
                        {quiz.difficulty}
                      </Badge>
                      <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                        {quiz.sport}
                      </Badge>
                    </div>
                    <h3 className={cn("text-lg font-bold text-white drop-shadow-lg")}>
                      {quiz.title}
                    </h3>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {quiz.description && (
                      <p className={cn("text-sm line-clamp-2", getTextColor(theme, "secondary"))}>
                        {quiz.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className={getTextColor(theme, "muted")}>
                            {formatDuration(quiz.duration)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className={getTextColor(theme, "muted")}>
                            {quiz._count?.attempts || 0}
                          </span>
                        </div>
                      </div>
                      {quiz.averageRating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className={getTextColor(theme, "muted")}>
                            {quiz.averageRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className={cn("p-12 text-center", getGlassCard(theme))}>
            <h2 className={cn("text-lg font-semibold mb-2", getTextColor(theme, "primary"))}>
              No quizzes match your filters
            </h2>
            <p className={cn("text-sm", getTextColor(theme, "secondary"))}>
              Try adjusting your filters or check back soon as new trivia challenges are added regularly.
            </p>
          </Card>
        )}

        {/* Pagination */}
        {listing.pagination.pages > 1 && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={listing.pagination.page === 1}>
                Previous
              </Button>
              <span className={cn("text-sm px-4", getTextColor(theme, "secondary"))}>
                Page {listing.pagination.page} of {listing.pagination.pages}
              </span>
              <Button variant="outline" size="sm" disabled={listing.pagination.page === listing.pagination.pages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
