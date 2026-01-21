"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Sparkles, Plus } from "lucide-react";
import { Difficulty } from "@prisma/client";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

const difficultyColors: Record<Difficulty, string> = {
  EASY: "text-emerald-400 border-emerald-500/20 shadow-neon-lime/10",
  MEDIUM: "text-cyan-400 border-cyan-500/20 shadow-neon-cyan/10",
  HARD: "text-magenta-400 border-magenta-500/20 shadow-neon-magenta/10",
};

interface ComingSoonQuiz {
  title: string;
  sport: string;
  difficulty: Difficulty;
  estimatedDate?: string;
  description?: string;
}

interface ComingSoonWidgetProps {
  quizzes: ComingSoonQuiz[];
}

export function ComingSoonWidget({ quizzes }: ComingSoonWidgetProps) {
  if (quizzes.length === 0) {
    return null;
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-4">
          <div className="h-6 w-1 rounded-full bg-accent shadow-neon-lime" />
          <h2 className="text-2xl font-black tracking-tight uppercase">Coming Soon</h2>
        </div>
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl glass border border-white/10">
          <Sparkles className="h-4 w-4 text-accent animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-accent">
            {quizzes.length} IN DEVELOPMENT
          </span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz, index) => {
          const difficultyLabel = quiz.difficulty.toUpperCase();

          return (
            <div
              key={index}
              className="group relative overflow-hidden rounded-[2.5rem] border border-dashed border-white/10 bg-white/[0.02] transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] p-8"
            >
              {/* Decorative Pattern Background */}
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Sparkles className="h-24 w-24 text-white" />
              </div>

              <div className="relative z-10 space-y-6">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "px-3 py-1 rounded-full glass border text-[10px] font-black tracking-widest uppercase",
                    difficultyColors[quiz.difficulty]
                  )}>
                    {difficultyLabel}
                  </div>
                  <div className="h-10 w-10 rounded-full glass border border-white/5 flex items-center justify-center text-muted-foreground group-hover:text-accent transition-colors">
                    <Plus className="h-5 w-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">
                    {quiz.title}
                  </h3>
                  {quiz.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground font-medium leading-relaxed">
                      {quiz.description}
                    </p>
                  )}
                </div>

                <div className="pt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                    <Clock className="h-3 w-3 text-secondary" />
                    <span>{quiz.sport}</span>
                  </div>
                  {quiz.estimatedDate && (
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
                      <Calendar className="h-3 w-3 text-primary" />
                      <span>RELEASING: {quiz.estimatedDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Animated corner accent */}
              <div className="absolute bottom-0 right-0 h-16 w-16 bg-gradient-to-br from-transparent to-white/5 translate-x-1/2 translate-y-1/2 rotate-45 group-hover:scale-150 transition-transform duration-700" />
            </div>
          );
        })}
      </div>
    </section>
  );
}
