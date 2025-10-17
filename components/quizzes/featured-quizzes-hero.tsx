"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Star, Clock, Users, Sparkles } from "lucide-react";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";
import { cn } from "@/lib/utils";
import { Difficulty } from "@prisma/client";

const difficultyColors: Record<Difficulty, string> = {
  EASY: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  HARD: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

function formatDuration(duration?: number | null) {
  if (!duration) return "Flexible";
  const minutes = Math.max(1, Math.round(duration / 60));
  return `${minutes} min${minutes === 1 ? "" : "s"}`;
}

interface FeaturedQuizzesHeroProps {
  featuredQuizzes: PublicQuizListItem[];
}

export function FeaturedQuizzesHero({ featuredQuizzes }: FeaturedQuizzesHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || featuredQuizzes.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredQuizzes.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredQuizzes.length]);

  if (featuredQuizzes.length === 0) {
    return null;
  }

  const currentQuiz = featuredQuizzes[currentIndex];
  const rating = currentQuiz.averageRating ?? 0;
  const hasRating = currentQuiz.totalReviews > 0;
  const difficultyLabel = `${currentQuiz.difficulty.charAt(0)}${currentQuiz.difficulty
    .slice(1)
    .toLowerCase()}`;

  const handlePrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + featuredQuizzes.length) % featuredQuizzes.length);
  };

  const handleNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % featuredQuizzes.length);
  };

  return (
    <section className="relative mb-12 overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 via-background to-background shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-purple-500/10" />
      
      <div className="relative grid gap-0 lg:grid-cols-5">
        {/* Image Section */}
        <div className="relative aspect-[16/9] lg:col-span-3 lg:aspect-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent lg:hidden" />
          {currentQuiz.descriptionImageUrl ? (
            <Image
              src={currentQuiz.descriptionImageUrl}
              alt={currentQuiz.title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 60vw, 100vw"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/20">
              <Sparkles className="h-24 w-24 text-primary/30" />
            </div>
          )}
          
          {/* Badge Overlay */}
          <div className="absolute left-6 top-6 flex items-center gap-2">
            <Badge className="bg-primary px-4 py-2 text-sm font-bold uppercase tracking-wide text-primary-foreground shadow-lg">
              <Sparkles className="mr-2 h-4 w-4" />
              Featured
            </Badge>
          </div>

          {/* Navigation Dots */}
          {featuredQuizzes.length > 1 && (
            <div className="absolute bottom-6 left-6 flex gap-2">
              {featuredQuizzes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === currentIndex
                      ? "w-8 bg-primary"
                      : "w-2 bg-white/50 hover:bg-white/70"
                  )}
                  aria-label={`Go to quiz ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="relative flex flex-col justify-center gap-6 p-8 lg:col-span-2 lg:p-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  difficultyColors[currentQuiz.difficulty]
                )}
              >
                {difficultyLabel}
              </Badge>
              <span className="text-sm font-medium text-muted-foreground">
                {currentQuiz.sport || "Multi-sport"}
              </span>
            </div>

            <h2 className="text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
              {currentQuiz.title}
            </h2>

            {currentQuiz.description && (
              <p className="line-clamp-3 text-base text-muted-foreground lg:text-lg">
                {currentQuiz.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(currentQuiz.duration)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{currentQuiz._count.attempts.toLocaleString()} attempts</span>
              </div>
              {hasRating && (
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-medium text-foreground">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground/80">
                    ({currentQuiz.totalReviews})
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild size="lg" className="shadow-lg">
              <Link href={`/quizzes/${currentQuiz.slug}`}>
                Start Quiz Now
              </Link>
            </Button>

            {featuredQuizzes.length > 1 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevious}
                  className="h-10 w-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNext}
                  className="h-10 w-10"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

