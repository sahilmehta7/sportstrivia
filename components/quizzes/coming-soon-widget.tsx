"use client";

import { Clock, Calendar, Sparkles, Plus, Binary, Database, Zap, ShieldAlert, Cpu } from "lucide-react";
import { Difficulty } from "@prisma/client";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

const difficultyColors: Record<Difficulty, string> = {
  EASY: "text-blue-500 border-blue-500/20 bg-blue-500/5",
  MEDIUM: "text-accent border-accent/20 bg-accent/5",
  HARD: "text-primary border-primary/20 bg-primary/5",
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
    <section className="space-y-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 border-b-2 border-foreground/5 pb-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 border border-foreground/10 px-4 py-1.5 bg-muted/30">
            <Cpu className="h-4 w-4 text-accent" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Performance Lab</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold uppercase tracking-tighter font-['Barlow_Condensed',sans-serif]">
            H.P. DEVELOPMENT PIPELINE
          </h2>
        </div>
        <div className="bg-foreground text-background px-6 py-3 shadow-athletic">
          <span className="text-xs font-bold uppercase tracking-[0.2em]">
            {quizzes.length} PROJECTS IN DESIGN Phase
          </span>
        </div>
      </div>

      <div className="grid gap-px bg-foreground/5 border border-foreground/5 sm:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz, index) => (
          <div key={index} className="group relative bg-background p-10 transition-all duration-300 hover:bg-muted/5">
            <div className="relative z-10 space-y-10 flex flex-col h-full justify-between">
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className={cn(
                    "px-4 py-1.5 border text-[9px] font-bold tracking-[0.2em] uppercase",
                    difficultyColors[quiz.difficulty]
                  )}>
                    {quiz.difficulty}
                  </div>
                  <div className="h-12 w-12 border border-foreground/5 flex items-center justify-center text-muted-foreground group-hover:border-accent group-hover:text-accent transition-all">
                    <Binary className="h-5 w-5 opacity-40 group-hover:opacity-100" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-3xl font-bold uppercase tracking-tighter leading-[0.85] font-['Barlow_Condensed',sans-serif] group-hover:text-accent transition-colors">
                    {quiz.title}
                  </h3>
                  {quiz.description && (
                    <p className="line-clamp-2 text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase leading-relaxed">
                      {quiz.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-8 border-t border-foreground/5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 border border-foreground/5 flex items-center justify-center bg-muted/10">
                    <Database className="h-4 w-4 text-accent/40" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{quiz.sport} MODULE</span>
                </div>
                {quiz.estimatedDate && (
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 border border-foreground/5 flex items-center justify-center bg-muted/10">
                      <Calendar className="h-4 w-4 text-accent/40" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent/80">ETA: {quiz.estimatedDate.toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Subtle background detail */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <span className="text-[4rem] font-bold leading-none select-none text-foreground/5">0{index + 1}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
