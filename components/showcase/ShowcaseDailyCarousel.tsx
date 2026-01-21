"use client";

import { useRef, useState, type PointerEvent, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Trophy, ChevronRight, Clock, Users, ArrowRight } from "lucide-react";
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
        className="flex gap-6 overflow-x-auto pb-8 pt-2 no-scrollbar scroll-smooth"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {/* Collection Header Card */}
        <div className="shrink-0 scroll-snap-align-start w-[280px]">
          <div className={cn(
            "relative h-full overflow-hidden rounded-[2.5rem] p-[2px]",
            "bg-gradient-to-br from-primary/30 via-white/5 to-transparent shadow-glass"
          )}>
            <div className="h-full w-full rounded-[2.4rem] glass-elevated p-8 flex flex-col items-center justify-center text-center space-y-6">
              <div className="h-16 w-16 rounded-2xl glass border border-white/10 flex items-center justify-center shadow-neon-cyan/20">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tight leading-none">
                  Fresh <br /> Challenges
                </h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                  Updated Every 24H
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 text-[10px] font-black uppercase tracking-widest text-primary">
                {dailyQuizzes.length} Arenas Live
              </div>
            </div>
          </div>
        </div>

        {/* Daily Quiz Cards */}
        {dailyQuizzes.map((quiz) => (
          <div key={quiz.id} className="shrink-0 scroll-snap-align-start w-[320px]">
            <Link
              href={`/quizzes/${quiz.slug}`}
              className="group/card block relative aspect-[4/5] overflow-hidden rounded-[2.5rem] p-[2px] transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="h-full w-full rounded-[2.4rem] glass-elevated overflow-hidden flex flex-col">
                <div className="relative flex-1 overflow-hidden">
                  {quiz.descriptionImageUrl ? (
                    <Image
                      src={quiz.descriptionImageUrl}
                      alt={quiz.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover/card:scale-110"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-white/5 to-white/10" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                  {/* Status Badges */}
                  <div className="absolute top-6 left-6 flex flex-wrap gap-2">
                    {quiz.completedToday && (
                      <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg">
                        <Trophy className="h-3 w-3" />
                        Done
                      </div>
                    )}
                    {quiz.streakCount > 0 && (
                      <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-orange-500 text-white shadow-lg">
                        🔥 {quiz.streakCount}
                      </div>
                    )}
                  </div>

                  {quiz.userRank && quiz.userRank > 0 && (
                    <div className="absolute top-6 right-6">
                      <div className="h-10 w-10 rounded-xl glass border border-white/20 flex items-center justify-center text-sm font-black text-primary shadow-neon-cyan/20">
                        #{quiz.userRank}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-8 space-y-4">
                  <h3 className="line-clamp-2 text-xl font-black uppercase tracking-tight leading-tight group-hover/card:text-primary transition-colors">
                    {quiz.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      <Clock className="h-3 w-3 text-secondary" />
                      <span>Daily</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary group-hover/card:translate-x-1 transition-transform">
                      <span>Enter</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>

                <div className="h-1 w-0 bg-primary group-hover/card:w-full transition-all duration-500 shadow-neon-cyan" />
              </div>
            </Link>
          </div>
        ))}

        {/* Placeholder/More card if needed */}
        <div className="shrink-0 scroll-snap-align-start w-[240px] pr-8">
          <Link href="/quizzes" className="h-full flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground hover:text-primary transition-colors group/more">
            <div className="h-16 w-16 rounded-full glass border border-white/5 flex items-center justify-center group-hover/more:border-primary/20 transition-colors">
              <ArrowRight className="h-8 w-8 group-hover/more:translate-x-1 transition-transform" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest">
              View More <br /> Challenges
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
