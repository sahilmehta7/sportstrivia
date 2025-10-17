"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Star, Trophy, Flame, ChevronRight } from "lucide-react";
import { Difficulty } from "@prisma/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

const difficultyColors: Record<Difficulty, string> = {
  EASY: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  HARD: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

interface DailyQuiz {
  id: string;
  slug: string;
  title: string;
  sport: string | null;
  difficulty: Difficulty;
  duration: number | null;
  descriptionImageUrl: string | null;
  description: string | null;
  completedToday: boolean;
  streakCount: number;
}

interface DailyQuizWidgetProps {
  dailyQuizzes: DailyQuiz[];
}

function formatDuration(duration?: number | null) {
  if (!duration) return "Flexible";
  const minutes = Math.max(1, Math.round(duration / 60));
  return `${minutes} min${minutes === 1 ? "" : "s"}`;
}

export function DailyQuizWidget({ dailyQuizzes }: DailyQuizWidgetProps) {
  if (dailyQuizzes.length === 0) {
    return null;
  }

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="mb-12">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Daily Challenge</h2>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary">
          Resets in {24 - new Date().getHours()}h
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {dailyQuizzes.map((quiz, index) => {
          const difficultyLabel = `${quiz.difficulty.charAt(0)}${quiz.difficulty
            .slice(1)
            .toLowerCase()}`;

          const isMainChallenge = index === 0;

          return (
            <Card
              key={quiz.id}
              className={cn(
                "group relative overflow-hidden border-2 transition-all hover:shadow-2xl",
                isMainChallenge
                  ? "border-primary/50 bg-gradient-to-br from-primary/10 via-background to-background lg:col-span-2"
                  : "border-border/60 bg-gradient-to-br from-background via-background to-muted/20"
              )}
            >
              <CardContent className={cn("p-0", isMainChallenge && "lg:flex")}>
                {/* Image Section */}
                {quiz.descriptionImageUrl && (
                  <div
                    className={cn(
                      "relative overflow-hidden bg-muted",
                      isMainChallenge
                        ? "aspect-[16/9] lg:w-2/5 lg:aspect-auto"
                        : "aspect-[16/9]"
                    )}
                  >
                    <Image
                      src={quiz.descriptionImageUrl}
                      alt={quiz.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes={isMainChallenge ? "(min-width: 1024px) 40vw, 100vw" : "50vw"}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
                    
                    {/* Completion Badge */}
                    {quiz.completedToday && (
                      <div className="absolute right-4 top-4">
                        <Badge className="bg-emerald-500 text-white shadow-lg">
                          <Trophy className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Content Section */}
                <div
                  className={cn(
                    "flex flex-col justify-between",
                    isMainChallenge ? "p-8 lg:w-3/5 lg:p-12" : "p-6"
                  )}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-gradient-to-r from-primary to-purple-600 text-white"
                        >
                          <Calendar className="mr-1 h-3 w-3" />
                          {isMainChallenge ? "Today's Challenge" : "Daily"}
                        </Badge>
                        <Badge
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs",
                            difficultyColors[quiz.difficulty]
                          )}
                        >
                          {difficultyLabel}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h3
                        className={cn(
                          "font-bold leading-tight",
                          isMainChallenge ? "text-2xl lg:text-3xl" : "text-xl"
                        )}
                      >
                        {quiz.title}
                      </h3>
                      {quiz.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {quiz.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        <span>{formatDuration(quiz.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Star className="h-4 w-4" />
                        <span>{quiz.sport || "Multi-sport"}</span>
                      </div>
                      {quiz.streakCount > 0 && (
                        <div className="flex items-center gap-1.5 text-orange-600">
                          <Flame className="h-4 w-4 fill-orange-600" />
                          <span className="font-semibold">
                            {quiz.streakCount} day streak!
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <Button
                      asChild
                      size={isMainChallenge ? "lg" : "default"}
                      className={cn(
                        "shadow-lg",
                        quiz.completedToday &&
                          "bg-emerald-600 hover:bg-emerald-700"
                      )}
                    >
                      <Link href={`/quizzes/${quiz.slug}`}>
                        {quiz.completedToday ? "Play Again" : "Start Challenge"}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                    {isMainChallenge && (
                      <div className="text-sm text-muted-foreground">
                        <Calendar className="mb-1 inline h-4 w-4" /> {today}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>

              {/* Decorative Elements */}
              <div className="pointer-events-none absolute right-4 top-4 opacity-5 transition-opacity group-hover:opacity-10">
                <Trophy className={cn(isMainChallenge ? "h-32 w-32" : "h-24 w-24")} />
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

