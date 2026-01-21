"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Star, Trophy, Flame, ChevronRight, Zap, Activity, Sparkles } from "lucide-react";
import { Difficulty } from "@prisma/client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { getGradientText } from "@/lib/showcase-theme";

const difficultyColors: Record<Difficulty, string> = {
  EASY: "text-emerald-400 border-emerald-500/20 shadow-neon-lime/10",
  MEDIUM: "text-cyan-400 border-cyan-500/20 shadow-neon-cyan/10",
  HARD: "text-magenta-400 border-magenta-500/20 shadow-neon-magenta/10",
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
  return `${minutes} MINS`;
}

export function DailyQuizWidget({ dailyQuizzes }: DailyQuizWidgetProps) {
  if (dailyQuizzes.length === 0) return null;

  const hoursRemaining = 24 - new Date().getHours();

  return (
    <section className="mb-20 space-y-10 px-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-4 w-1 rounded-full bg-primary shadow-neon-cyan" />
          <h2 className="text-2xl font-black uppercase tracking-tight">Mission Assignments</h2>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 rounded-2xl glass border border-white/10 shadow-neon-cyan/5">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">
            RESET IN {hoursRemaining}H
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {dailyQuizzes.map((quiz, index) => {
          const isMain = index === 0;
          return (
            <div key={quiz.id} className={cn("group relative", isMain ? "lg:col-span-2" : "lg:col-span-1")}>
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem]" />

              <div className={cn(
                "relative overflow-hidden rounded-[3rem] glass-elevated border border-white/5 transition-all duration-500",
                "hover:border-primary/20 hover:scale-[1.01] hover:bg-white/5 flex flex-col md:flex-row",
                isMain ? "min-h-[400px]" : "min-h-[300px]"
              )}>
                {quiz.descriptionImageUrl && (
                  <div className={cn("relative overflow-hidden w-full md:w-2/5 shrink-0", !isMain && "md:w-1/3")}>
                    <Image
                      src={quiz.descriptionImageUrl}
                      alt={quiz.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.5] group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/40 to-background hidden md:block" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent md:hidden" />

                    {quiz.completedToday && (
                      <div className="absolute top-6 left-6">
                        <Badge variant="neon" className="px-3 py-1 text-[8px] tracking-widest uppercase">
                          <Trophy className="mr-2 h-3 w-3" />
                          SYNC COMPLETED
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 p-8 lg:p-12 flex flex-col justify-between gap-8">
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="glass" className="bg-white/5 border-white/5 text-[8px] font-black tracking-widest uppercase">
                        {isMain ? "PRIMARY OBJECTIVE" : "RECON MISSION"}
                      </Badge>
                      <div className={cn("text-[8px] font-black tracking-[0.3em] uppercase px-2 py-0.5 rounded-full border", difficultyColors[quiz.difficulty])}>
                        {quiz.difficulty}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className={cn("font-black uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors", isMain ? "text-4xl lg:text-5xl" : "text-2xl")}>
                        {quiz.title}
                      </h3>
                      {isMain && quiz.description && (
                        <p className="text-xs font-bold tracking-widest text-muted-foreground/60 uppercase leading-relaxed line-clamp-2">
                          {quiz.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl glass border border-white/5 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-primary/60" />
                        </div>
                        <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/80">{formatDuration(quiz.duration)}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-xl glass border border-white/5 flex items-center justify-center">
                          <Star className="h-4 w-4 text-secondary/60" />
                        </div>
                        <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/80">{quiz.sport || "ALL-SPORT"}</span>
                      </div>
                      {quiz.streakCount > 0 && (
                        <div className="flex items-center gap-3 text-orange-400 drop-shadow-neon-orange">
                          <Flame className="h-4 w-4 fill-current" />
                          <span className="text-[10px] font-black tracking-widest uppercase">{quiz.streakCount} DAY BURST</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button asChild variant={isMain ? "neon" : "glass"} size="xl" className="rounded-2xl w-full sm:w-fit px-10">
                    <Link href={`/quizzes/${quiz.slug}`}>
                      {quiz.completedToday ? "REPLAY MISSION" : "INITIALIZE SYNC"}
                      <ChevronRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Decorative decor */}
              <div className="absolute -top-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
                {isMain ? <Activity className="h-48 w-48" /> : <Zap className="h-32 w-32" />}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
