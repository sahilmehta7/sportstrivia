"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trophy, Users, BookOpen, Star, ArrowRight, Target, ShieldCheck } from "lucide-react";
import { getGradientText } from "@/lib/showcase-theme";

interface HeroSectionProps {
  stats: {
    totalQuizzes: number;
    activeUsers: number;
    questionsAnswered: number;
    averageRating: number;
  };
}

export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="relative px-4 py-20 sm:px-6 lg:py-40 overflow-hidden bg-background">
      {/* Background Pattern - Subtle Editorial Grid */}
      <div className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

          {/* Left Column: Content */}
          <div className="flex-1 text-left space-y-10">
            <div className="inline-flex items-center gap-3 px-3 py-1 border-l-4 border-accent bg-accent/5">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Professional Edition</p>
            </div>

            <div className="space-y-6">
              <h1 className={cn(
                "text-6xl sm:text-8xl lg:text-9xl font-bold uppercase tracking-tighter leading-[0.8] font-['Barlow_Condensed',sans-serif]",
                "text-foreground"
              )}>
                THE ULTIMATE <br />
                <span className={getGradientText("editorial")}>SPORTS IQ TEST</span>
              </h1>

              <p className="max-w-xl text-lg sm:text-xl font-medium text-muted-foreground/90 leading-relaxed">
                Join the arena where sports knowledge meets professional competition.
                Challenge your limits across every major league and claim your place among the elite.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/auth/signin" className="w-full sm:w-auto">
                <Button
                  size="xl"
                  className="w-full sm:min-w-[240px] gap-3 font-bold uppercase tracking-widest text-base rounded-none shadow-athletic"
                >
                  Start The Challenge
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>

              <Link href="/quizzes" className="w-full sm:w-auto">
                <Button
                  size="xl"
                  variant="outline"
                  className="w-full sm:min-w-[240px] gap-3 font-bold uppercase tracking-widest text-base rounded-none border-2"
                >
                  Explore Archives
                  <BookOpen className="h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Quick Ratings */}
            <div className="flex items-center gap-6 pt-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-muted overflow-hidden flex items-center justify-center grayscale">
                    <Users className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-3 w-3 fill-accent text-accent" />)}
                  <span className="text-sm font-bold ml-2">4.9/5.0</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trusted by 10k+ Athletes</p>
              </div>
            </div>
          </div>

          {/* Right Column: Featured Image / Visual */}
          <div className="flex-1 w-full max-w-xl lg:max-w-none">
            <div className="relative aspect-[4/5] bg-muted overflow-hidden border-8 border-foreground shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] dark:shadow-[20px_20px_0px_0px_rgba(255,255,255,0.1)] group">
              {/* This would be a high-quality sports action shot in production */}
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent flex flex-col justify-end p-12 text-background">
                <p className="text-xs font-bold uppercase tracking-widest mb-2 text-accent">Arena Spotlight</p>
                <h3 className="text-4xl font-bold font-['Barlow_Condensed',sans-serif] uppercase mb-4">NBA Legends Edition</h3>
                <Link href="/quizzes/nba-legends" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest group-hover:gap-4 transition-all">
                  Take The Quiz <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 p-8">
                <Target className="h-16 w-16 text-background/20" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row - Underneath */}
        <div className="mt-24 pt-16 border-t-2 border-foreground/5 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Trophy, value: `${stats.totalQuizzes}+`, label: "Competitions", suffix: "Live" },
            { icon: Users, value: `${stats.activeUsers.toLocaleString()}+`, label: "Contributors", suffix: "Verified" },
            { icon: Target, value: `${stats.questionsAnswered.toLocaleString()}`, label: "Answers", suffix: "Recorded" },
            { icon: Star, value: `${stats.averageRating.toFixed(1)}`, label: "Avg Rating", suffix: "Stars" }
          ].map((item, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-accent" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.suffix}</span>
              </div>
              <div>
                <div className="text-4xl sm:text-5xl font-bold font-['Barlow_Condensed',sans-serif] tracking-tight">{item.value}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}