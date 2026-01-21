"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { cn } from "@/lib/utils";
import { Trophy, Users, BookOpen, Star, ArrowRight, Sun, Moon, Zap, Activity, Target } from "lucide-react";
import { getGradientText, getBlurCircles } from "@/lib/showcase-theme";

interface HeroSectionProps {
  stats: {
    totalQuizzes: number;
    activeUsers: number;
    questionsAnswered: number;
    averageRating: number;
  };
}

export function HeroSection({ stats }: HeroSectionProps) {
  const { theme, toggleTheme } = useShowcaseTheme();
  const { circle1, circle2, circle3 } = getBlurCircles();

  return (
    <section className="relative px-4 py-20 sm:px-6 lg:py-32 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 -z-10">{circle1}{circle2}{circle3}</div>

      <div className="absolute top-20 -left-20 opacity-[0.03] animate-pulse pointer-events-none">
        <Activity className="h-64 w-64" />
      </div>
      <div className="absolute bottom-20 -right-20 opacity-[0.02] rotate-12 pointer-events-none">
        <Target className="h-96 w-96" />
      </div>

      <div className="mx-auto max-w-6xl text-center relative z-10">
        {/* Theme Toggle Button */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex glass border border-white/10 rounded-full p-1 shadow-neon-cyan/5">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={cn(
                "rounded-full px-6 h-9 text-[10px] font-black uppercase tracking-widest transition-all",
                theme === "dark" ? "bg-primary text-primary-foreground shadow-neon-cyan" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Moon className="h-4 w-4 mr-2" /> MATRIX DARK
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className={cn(
                "rounded-full px-6 h-9 text-[10px] font-black uppercase tracking-widest transition-all",
                theme === "light" ? "bg-primary text-primary-foreground shadow-neon-cyan" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sun className="h-4 w-4 mr-2" /> LIGHT SENSE
            </Button>
          </div>
        </div>

        {/* Main heading */}
        <div className="space-y-8 mb-16">
          <div className="flex justify-center flex-col items-center gap-4">
            <div className="h-20 w-1 rounded-full bg-primary shadow-neon-cyan" />
            <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.5em] text-primary">MISSION INITIALIZED</p>
          </div>

          <h1 className={cn(
            "text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] mb-8",
            getGradientText("neon")
          )}>
            DOMINATE THE <br className="hidden sm:block" /> ARENA
          </h1>

          <p className="mx-auto max-w-3xl text-sm sm:text-lg lg:text-xl font-bold tracking-widest text-muted-foreground/80 uppercase leading-relaxed">
            The ultimate sports trivia matrix. Compete with elite fans,
            resolve high-impact queries, and claim your championship status
            in the knowledge collective.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="mb-20 flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link href="/auth/signin" className="w-full sm:w-auto">
            <Button
              size="xl"
              variant="neon"
              className="w-full sm:min-w-[260px] gap-4 font-black uppercase tracking-widest text-lg shadow-neon-cyan/40 hover:scale-105 transition-transform"
            >
              Enter Arena
              <ArrowRight className="h-6 w-6" />
            </Button>
          </Link>

          <Link href="/quizzes" className="w-full sm:w-auto">
            <Button
              size="xl"
              variant="glass"
              className="w-full sm:min-w-[260px] gap-4 font-black uppercase tracking-widest text-lg border-white/10 hover:bg-white/5 transition-all hover:scale-105"
            >
              Analyze Catalog
              <BookOpen className="h-6 w-6" />
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {[
            {
              icon: BookOpen,
              value: `${stats.totalQuizzes.toLocaleString()}+`,
              label: "ACTIVE ARENAS",
              color: "text-primary",
              glow: "shadow-neon-cyan/10"
            },
            {
              icon: Users,
              value: `${stats.activeUsers.toLocaleString()}+`,
              label: "IDENTIFIED ENTITIES",
              color: "text-secondary",
              glow: "shadow-neon-magenta/10"
            },
            {
              icon: Trophy,
              value: `${stats.questionsAnswered.toLocaleString()}+`,
              label: "RECAPTURED DATA",
              color: "text-accent",
              glow: "shadow-neon-lime/10"
            },
            {
              icon: Star,
              value: stats.averageRating.toFixed(1),
              label: "OPERATIONAL STABILITY",
              color: "text-primary",
              glow: "shadow-neon-cyan/10"
            }
          ].map((item, i) => (
            <div key={i} className={cn(
              "group relative overflow-hidden rounded-[2.5rem] p-8 glass border border-white/5 transition-all duration-500",
              "hover:border-white/10 hover:bg-white/[0.03] hover:-translate-y-2",
              item.glow
            )}>
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className={cn("absolute inset-0 blur-xl opacity-20", item.color)} />
                  <div className="relative h-12 w-12 rounded-2xl glass border border-white/5 flex items-center justify-center">
                    <item.icon className={cn("h-6 w-6", item.color)} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-3xl font-black tracking-tighter uppercase">{item.value}</div>
                  <div className="text-[10px] font-black tracking-widest text-muted-foreground/40 uppercase truncate">{item.label}</div>
                </div>
              </div>

              <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                <item.icon className="h-16 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}