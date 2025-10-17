"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Sparkles } from "lucide-react";
import { Difficulty } from "@prisma/client";
import { cn } from "@/lib/utils";

const difficultyColors: Record<Difficulty, string> = {
  EASY: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  HARD: "bg-rose-500/10 text-rose-600 border-rose-500/30",
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
    <section className="mb-12">
      <div className="mb-6 flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Coming Soon</h2>
        <Badge variant="secondary" className="ml-auto">
          {quizzes.length} new {quizzes.length === 1 ? "quiz" : "quizzes"}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quizzes.map((quiz, index) => {
          const difficultyLabel = `${quiz.difficulty.charAt(0)}${quiz.difficulty
            .slice(1)
            .toLowerCase()}`;

          return (
            <Card
              key={index}
              className="group relative overflow-hidden border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex items-start justify-between gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary"
                  >
                    Coming Soon
                  </Badge>
                  <Badge
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs",
                      difficultyColors[quiz.difficulty]
                    )}
                  >
                    {difficultyLabel}
                  </Badge>
                </div>

                <h3 className="mb-2 text-lg font-semibold leading-tight">
                  {quiz.title}
                </h3>

                {quiz.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                    {quiz.description}
                  </p>
                )}

                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{quiz.sport}</span>
                  </div>
                  {quiz.estimatedDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Expected: {quiz.estimatedDate}</span>
                    </div>
                  )}
                </div>

                <div className="absolute right-4 top-4 opacity-5 transition-opacity group-hover:opacity-10">
                  <Sparkles className="h-16 w-16" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

