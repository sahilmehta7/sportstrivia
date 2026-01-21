"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Sparkles, Plus, Binary, Database, Zap } from "lucide-react";
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
  if (quizzes.length === 0) return null;

  return (
    <section className="space-y-10 px-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-4 w-1 rounded-full bg-secondary shadow-neon-magenta" />
          <h2 className="text-2xl font-black uppercase tracking-tight">Development Pipeline</h2>
        </div>
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl glass border border-white/10 shadow-neon-magenta/5">
          <Sparkles className="h-4 w-4 text-secondary animate-pulse shadow-neon-magenta" />
          <span className="text-[10px] font-black uppercase tracking-widest text-secondary">
            {quizzes.length} MATRICES IN SYNTHESIS
          </span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz, index) => (
          <div key={index} className="group relative overflow-hidden rounded-[3rem] border border-dashed border-white/10 bg-white/[0.01] transition-all duration-500 hover:border-primary/20 hover:bg-white/[0.03] p-10">
            <div className="relative z-10 space-y-8 flex flex-col h-full justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "px-3 py-1 rounded-full glass border text-[8px] font-black tracking-[0.2em] uppercase",
                    difficultyColors[quiz.difficulty]
                  )}>
                    {quiz.difficulty}
                  </div>
                  <div className="h-10 w-10 rounded-2xl glass border border-white/5 flex items-center justify-center text-muted-foreground group-hover:border-primary/40 group-hover:text-primary transition-all shadow-glass">
                    <Binary className="h-5 w-5 opacity-40 group-hover:opacity-100" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-black uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors">
                    {quiz.title}
                  </h3>
                  {quiz.description && (
                    <p className="line-clamp-2 text-xs font-bold tracking-widest text-muted-foreground/40 uppercase leading-relaxed">
                      {quiz.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-xl glass border border-white/5 flex items-center justify-center">
                    <Database className="h-4 w-4 text-secondary/40" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{quiz.sport} MODULE</span>
                </div>
                {quiz.estimatedDate && (
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-xl glass border border-white/5 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary/40" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">DEPLOYMENT: {quiz.estimatedDate.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.01] group-hover:opacity-[0.03] transition-opacity pointer-events-none scale-150 rotate-12">
              <Plus className="h-64 w-64 text-white" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
