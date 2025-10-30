"use client";

import { useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Trophy, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyQuizItem } from "@/lib/services/public-quiz.service";
import { glassText } from "@/components/showcase/ui/typography";

interface ShowcaseDailyCarouselProps {
  dailyQuizzes: DailyQuizItem[];
  className?: string;
}

export function ShowcaseDailyCarousel({ 
  dailyQuizzes, 
  className 
}: ShowcaseDailyCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0 });

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    dragState.current = {
      startX: event.clientX,
      scrollLeft: containerRef.current.scrollLeft,
    };
    containerRef.current.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const delta = event.clientX - dragState.current.startX;
    containerRef.current.scrollLeft = dragState.current.scrollLeft - delta;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    containerRef.current.releasePointerCapture(event.pointerId);
    setIsDragging(false);
  };

  if (dailyQuizzes.length === 0) {
    return null;
  }

  const containerStyles = cn(
    "flex w-full gap-4 overflow-x-auto scroll-smooth rounded-[2rem] border p-4",
    // Glassmorphism container surface
    "bg-card/80 backdrop-blur-lg border-border shadow-lg",
    className
  );

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className={containerStyles}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Fixed Header Tile */}
        <div className={cn(
          "relative min-w-[240px] overflow-hidden rounded-[1.5rem]",
          // Glassmorphism tile
          "bg-card/60 backdrop-blur-md border border-border/60 shadow-sm"
        )}>
          <div className="relative aspect-[16/9] flex flex-col items-center justify-center p-4 text-center">
            <Calendar className="mb-2 h-8 w-8 text-primary" />
            <h2 className={cn("mb-1", glassText.h3)}>
              Daily Quizzes
            </h2>
            <p className={cn("text-xs", glassText.subtitle)}>
              Fresh challenges every day
            </p>
            <div className="mt-2">
              <span className="rounded-full px-2 py-1 text-xs font-semibold bg-muted text-muted-foreground">
                {dailyQuizzes.length} Available
              </span>
            </div>
          </div>
        </div>

        {/* Quiz Tiles */}
        {dailyQuizzes.map((quiz) => {
          const hasRank = quiz.userRank !== undefined && quiz.userRank > 0;

          return (
            <Link
              key={quiz.id}
              href={`/quizzes/${quiz.slug}`}
              className="group relative min-w-[240px] overflow-hidden rounded-[1.5rem] transition-transform hover:scale-[1.02]"
            >
              <div className="relative aspect-[16/9] overflow-hidden rounded-[1.5rem]">
                {/* Cover Image */}
                {quiz.descriptionImageUrl ? (
                  <Image
                    src={quiz.descriptionImageUrl}
                    alt={quiz.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 240px, 240px"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-muted to-muted/80" />
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Completion Badge */}
                {quiz.completedToday && (
                  <div className="absolute right-3 top-3">
                    <div className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                      "bg-emerald-500 text-white shadow-lg"
                    )}>
                      <Trophy className="h-3 w-3" />
                      Done
                    </div>
                  </div>
                )}

                {/* User Rank Badge */}
                {hasRank && (
                  <div className="absolute left-3 top-3">
                    <div className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                      "bg-blue-500 text-white shadow-lg"
                    )}>
                      <Trophy className="h-3 w-3" />
                      #{quiz.userRank}
                    </div>
                  </div>
                )}

                {/* Streak Badge */}
                {quiz.streakCount > 0 && (
                  <div className="absolute left-3 bottom-3">
                    <div className={cn(
                      "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                      "bg-orange-500 text-white shadow-lg"
                    )}>
                      🔥 {quiz.streakCount}
                    </div>
                  </div>
                )}

                {/* Quiz Title */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className={cn("line-clamp-2", glassText.h3, "text-white drop-shadow-lg") }>
                    {quiz.title}
                  </h3>
                </div>

                {/* Hover Arrow */}
                <div className="absolute right-3 bottom-3 opacity-0 transition-opacity group-hover:opacity-100">
                  <ChevronRight className="h-5 w-5 text-white drop-shadow-lg" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
