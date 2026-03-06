"use client";

import Link from "next/link";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Difficulty } from "@prisma/client";
import { Clock,  Users, Zap, PlayCircle, Trophy } from "lucide-react";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";


const difficultyColors: Record<Difficulty, string> = {
  EASY: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  HARD: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

function formatDuration(duration?: number | null) {
  if (!duration) return "STATIC";
  const minutes = Math.max(1, Math.round((duration || 0) / 60));
  return `${minutes} MIN`;
}

interface FeaturedCardProps {
  quiz: PublicQuizListItem;
  className?: string;
}

export function FeaturedCard({ quiz, className }: FeaturedCardProps) {
  const duration = formatDuration(quiz.duration);
  const rating = quiz.averageRating ?? 0;
  const hasRating = quiz.totalReviews > 0;

  return (
    <div className={cn("group relative", className)}>
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/5 to-secondary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-[3rem]" />

      <div className="relative h-full overflow-hidden rounded-[3rem] glass-elevated border border-border/60 transition-all duration-500 group-hover:border-primary/20 hover:scale-[1.01] hover:bg-card/60">
        <div className="relative aspect-[16/8] w-full overflow-hidden">
          {quiz.descriptionImageUrl ? (
            <Image
              src={quiz.descriptionImageUrl}
              alt={quiz.title}
              fill
              className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/15 to-transparent" />

          <div className="absolute top-6 left-6 flex items-center gap-3">
            <div className={cn(
              "px-3 py-1 rounded-full glass border text-[8px] font-black tracking-widest uppercase",
              difficultyColors[quiz.difficulty]
            )}>
              {quiz.difficulty}
            </div>
            {quiz.sport && (
              <Badge variant="glass" className="border-border/50 bg-muted/70 text-[8px] font-black tracking-widest uppercase text-foreground shadow-sm">
                {quiz.sport}
              </Badge>
            )}
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
            <div className="flex h-14 w-14 items-center justify-center rounded-full glass border border-border/70 text-primary shadow-athletic backdrop-blur-md">
              <PlayCircle className="h-7 w-7 fill-primary/10" />
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-10 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1 rounded-full bg-primary shadow-neon-cyan" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">FEATURED ARENA</span>
            </div>
            <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {quiz.title}
            </h3>
            {quiz.description && (
              <p className="line-clamp-2 text-xs font-bold leading-relaxed tracking-widest text-muted-foreground uppercase">
                {quiz.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 border-t border-border/60 pt-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-primary/60 transition-colors group-hover:text-primary" />
                <span className="text-[10px] font-black tracking-widest uppercase">{duration}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 text-secondary/60 transition-colors group-hover:text-secondary" />
                <span className="text-[10px] font-black tracking-widest uppercase">{quiz._count.attempts.toLocaleString()} ENTRIES</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Trophy className="h-4 w-4 text-primary/60 transition-colors group-hover:text-primary" />
                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                  {hasRating ? rating.toFixed(1) : "NEW"}
                </span>
              </div>
            </div>

            <Button asChild variant="accent" size="xl" className="rounded-2xl px-10 group-hover:scale-[1.05] transition-transform">
              <Link href={`/quizzes/${quiz.slug}`}>
                Play NOW
              </Link>
            </Button>
          </div>
        </div>

        {/* Visual accent */}
        <div className="absolute -bottom-6 -left-6 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
          <Zap className="h-48 w-48" />
        </div>
      </div>
    </div>
  );
}
