"use client";

import { useRef, useState, type PointerEvent, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Zap, TrendingUp, ShieldAlert, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DailyQuizItem } from "@/lib/services/public-quiz.service";
import { getGradientText } from "@/lib/showcase-theme";

interface ShowcaseDailyCarouselProps {
  dailyQuizzes: DailyQuizItem[];
  className?: string;
}

export function ShowcaseDailyCarousel({
  dailyQuizzes,
  className
}: ShowcaseDailyCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (dailyQuizzes.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-full group", className)}>
      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-auto pb-8 pt-4 no-scrollbar scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {/* Collection Header Card */}
        <div className="shrink-0 scroll-snap-align-start w-[320px]">
          <div className={cn(
            "relative h-full overflow-hidden border-2 border-foreground/5 bg-muted/20 p-8 flex flex-col items-center justify-center text-center space-y-8",
          )}>
            <div className="relative">
              <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full" />
              <div className="relative h-20 w-20 border-2 border-foreground bg-background flex items-center justify-center shadow-athletic">
                <Calendar className="h-10 w-10 text-foreground" />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-bold uppercase tracking-tighter leading-none font-['Barlow_Condensed',sans-serif]">
                DAILY <br /> ARENAS
              </h3>
              <div className="h-1 w-12 bg-accent mx-auto" />
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em]">
                Updated Every 24H
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-[0.2em] shadow-athletic">
              {dailyQuizzes.length} ARENAS LIVE
            </div>
          </div>
        </div>

        {/* Daily Quiz Cards */}
        {dailyQuizzes.map((quiz) => (
          <div key={quiz.id} className="shrink-0 scroll-snap-align-start w-[340px]">
            <Link
              href={`/quizzes/${quiz.slug}`}
              className="group/card block relative aspect-[4/5] overflow-hidden border-2 border-foreground/5 bg-background transition-all duration-300 hover:border-foreground hover:shadow-athletic"
            >
              <div className="h-full w-full overflow-hidden flex flex-col">
                <div className="relative flex-1 overflow-hidden border-b-2 border-foreground/5">
                  {quiz.descriptionImageUrl ? (
                    <Image
                      src={quiz.descriptionImageUrl}
                      alt={quiz.title}
                      fill
                      className="object-cover grayscale transition-transform duration-700 group-hover/card:grayscale-0 group-hover/card:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted/30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />

                  {/* Status Badges */}
                  <div className="absolute top-0 right-0 z-10">
                    {quiz.completedToday && (
                      <div className="flex items-center gap-2 bg-foreground text-background px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em]">
                        <Trophy className="h-3 w-3 text-accent" />
                        Complete
                      </div>
                    )}
                  </div>

                  {quiz.streakCount > 0 && (
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-accent/20 border border-accent/30 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent">
                      🔥 STREAK: {quiz.streakCount}
                    </div>
                  )}

                  {/* Play Button Indicator */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300">
                    <div className="bg-accent p-4 text-white shadow-athletic">
                      <Play className="h-6 w-6 fill-current" />
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <h3 className="line-clamp-2 text-2xl font-bold uppercase tracking-tighter leading-none font-['Barlow_Condensed',sans-serif] group-hover/card:text-accent transition-colors">
                    {quiz.title}
                  </h3>

                  <div className="flex items-center justify-between border-t border-foreground/5 pt-6">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-accent" />
                      <span>LIVE TODAY</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-1 w-3 bg-foreground/10 group-hover/card:bg-accent transition-colors" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}

        {/* View All Card */}
        <div className="shrink-0 scroll-snap-align-start w-[280px] pr-8">
          <Link
            href="/quizzes"
            className="h-full flex flex-col items-center justify-center text-center space-y-6 border-2 border-dashed border-foreground/10 hover:border-foreground/30 hover:bg-muted/10 transition-all group/more"
          >
            <div className="h-16 w-16 border-2 border-foreground/10 flex items-center justify-center transition-all group-hover/more:border-accent group-hover/more:bg-accent group-hover/more:text-white">
              <ArrowRight className="h-8 w-8 group-hover/more:translate-x-1 transition-transform" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground group-hover/more:text-foreground transition-colors">
              VIEW FULL <br /> LIBRARY
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
