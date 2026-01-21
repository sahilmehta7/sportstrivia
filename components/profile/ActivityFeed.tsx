"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface QuizAttempt {
  id: string;
  score: number | null;
  passed: boolean | null;
  completedAt: Date | string;
  quiz: {
    title: string;
    slug: string;
  };
}

interface ActivityFeedProps {
  attempts: QuizAttempt[];
}

export function ActivityFeed({ attempts }: ActivityFeedProps) {
  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <div className="h-6 w-1 rounded-full bg-accent shadow-neon-lime" />
            <h4 className="text-2xl font-black uppercase tracking-tight">Mission Logs</h4>
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest pl-5">
            CHRONOLOGICAL DEPLOYMENT HISTORY
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {attempts.slice(0, 10).map((attempt) => (
          <Link
            key={attempt.id}
            href={`/quizzes/${attempt.quiz.slug}`}
            className="group block"
          >
            <div className="relative overflow-hidden rounded-2xl glass p-6 border border-white/5 transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/5 group-hover:translate-x-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl glass border transition-all duration-300 shadow-glass",
                    attempt.passed
                      ? "border-emerald-500/30 text-emerald-400 shadow-neon-lime/10"
                      : "border-red-500/30 text-red-400 shadow-neon-red/10"
                  )}>
                    {attempt.passed ? <ShieldCheck className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">
                      {attempt.quiz.title}
                    </p>
                    <div className="flex items-center gap-3">
                      <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                        {formatDate(attempt.completedAt)}
                      </p>
                      <div className="h-1 w-1 rounded-full bg-white/10" />
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        attempt.passed ? "text-emerald-500" : "text-red-500"
                      )}>
                        {attempt.passed ? "MISSION SUCCESS" : "MISSION FAILED"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-white/5 pt-4 sm:border-0 sm:pt-0">
                  {attempt.score !== null && (
                    <div className="text-right">
                      <div className="text-xl font-black tracking-tighter text-primary">
                        {Math.round(attempt.score)}%
                      </div>
                      <p className="text-[8px] font-bold tracking-widest text-muted-foreground uppercase">ACCURACY</p>
                    </div>
                  )}
                  <div className="h-10 w-10 rounded-xl glass border border-white/5 flex items-center justify-center group-hover:border-primary/40 group-hover:text-primary transition-all">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {attempts.length === 0 && (
          <div className="py-20 text-center space-y-4 rounded-[3rem] glass border border-dashed border-white/10">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground/20" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">NO RECENT ACTIVITY DETECTED</p>
          </div>
        )}
      </div>

      {attempts.length > 10 && (
        <div className="text-center pt-4">
          <Link href="/profile/activity" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            VIEW ALL CHRONICLES →
          </Link>
        </div>
      )}
    </div>
  );
}
