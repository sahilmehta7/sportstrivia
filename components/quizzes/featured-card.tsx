"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Difficulty } from "@prisma/client";
import { Clock, Star, Users, Zap, PlayCircle, Trophy } from "lucide-react";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";
import { getGradientText } from "@/lib/showcase-theme";

const difficultyColors: Record<Difficulty, string> = {
  EASY: "text-emerald-400 border-emerald-500/20 shadow-neon-lime/10",
  MEDIUM: "text-cyan-400 border-cyan-500/20 shadow-neon-cyan/10",
  HARD: "text-magenta-400 border-magenta-500/20 shadow-neon-magenta/10",
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

      <div className="relative h-full overflow-hidden rounded-[3rem] glass-elevated border border-white/5 transition-all duration-500 group-hover:border-primary/20 hover:scale-[1.01] hover:bg-white/5">
        <div className="relative aspect-[16/8] w-full overflow-hidden">
          {quiz.descriptionImageUrl ? (
            <Image
              src={quiz.descriptionImageUrl}
              alt={quiz.title}
              fill
              className="object-cover grayscale-[0.4] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

          <div className="absolute top-6 left-6 flex items-center gap-3">
            <div className={cn(
              "px-3 py-1 rounded-full glass border text-[8px] font-black tracking-widest uppercase",
              difficultyColors[quiz.difficulty]
            )}>
              {quiz.difficulty}
            </div>
            {quiz.sport && (
              <Badge variant="glass" className="bg-white/5 border-white/5 text-[8px] font-black tracking-widest uppercase shadow-lg">
                {quiz.sport}
              </Badge>
            )}
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
            <div className="h-14 w-14 rounded-full glass border border-white/20 flex items-center justify-center text-primary shadow-neon-cyan/40 backdrop-blur-md">
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
              <p className="line-clamp-2 text-xs font-bold tracking-widest text-muted-foreground/60 uppercase leading-relaxed">
                {quiz.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-white/5">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-black tracking-widest uppercase">{duration}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 text-secondary/40 group-hover:text-secondary transition-colors" />
                <span className="text-[10px] font-black tracking-widest uppercase">{quiz._count.attempts.toLocaleString()} ENTRIES</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Trophy className="h-4 w-4 text-primary/40 group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400">
                  {hasRating ? rating.toFixed(1) : "NEW"}
                </span>
              </div>
            </div>

            <Button asChild variant="neon" size="xl" className="rounded-2xl px-10 group-hover:scale-[1.05] transition-transform">
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
