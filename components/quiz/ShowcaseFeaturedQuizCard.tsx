"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Users, Clock, Trophy, Zap, PlayCircle, Activity, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getGradientText } from "@/lib/showcase-theme";

interface ShowcaseFeaturedQuizCardProps {
  title: string;
  subtitle?: string | null;
  category: string;
  durationLabel: string;
  difficultyLabel: string;
  playersLabel: string;
  ratingLabel?: string;
  coverImageUrl?: string | null;
  accent?: string;
  className?: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export function ShowcaseFeaturedQuizCard({
  title,
  subtitle,
  category,
  durationLabel,
  difficultyLabel,
  playersLabel,
  ratingLabel,
  coverImageUrl,
  accent = "rgba(34,211,238,0.2)",
  className,
  ctaHref,
  ctaLabel = "INITIALIZE MISSION",
}: ShowcaseFeaturedQuizCardProps) {
  return (
    <div className={cn("relative group w-full max-w-5xl", className)}>
      {/* Massive glow backdrop */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/5 to-secondary/20 blur-3xl opacity-40 group-hover:opacity-60 transition-opacity rounded-[4rem]" />

      <div className="relative overflow-hidden rounded-[3.5rem] glass-elevated border border-white/10 flex flex-col md:flex-row transition-all duration-500 group-hover:border-primary/20 shadow-2xl">
        {/* Image Section */}
        <div className="relative aspect-[16/9] md:aspect-auto md:w-2/5 overflow-hidden">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={title}
              fill
              className="object-cover grayscale-[0.4] group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
              sizes="(min-width: 1024px) 40vw, 100vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/40 to-background hidden md:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent md:hidden" />

          {/* Tactical Overlays */}
          <div className="absolute top-8 left-8">
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full glass border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] shadow-lg">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shadow-neon-cyan" />
              {category.toUpperCase()}
            </div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
            <div className="h-20 w-20 rounded-full glass border border-white/20 flex items-center justify-center text-primary shadow-neon-cyan/40 backdrop-blur-md">
              <PlayCircle className="h-10 w-10 fill-primary/10" />
            </div>
          </div>
        </div>

        <div className="flex-1 p-10 lg:p-16 flex flex-col justify-between gap-10">
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-1 rounded-full bg-primary shadow-neon-cyan" />
                <span className="text-xs font-black uppercase tracking-[0.5em] text-primary">MISSION CRITICAL</span>
              </div>
              <h2 className={cn("text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.85] group-hover:text-primary transition-colors", getGradientText("neon"))}>
                {title}
              </h2>
              {subtitle && (
                <p className="max-w-xl text-sm lg:text-base font-bold tracking-widest text-muted-foreground/60 uppercase leading-relaxed line-clamp-2">
                  {subtitle}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "DURATION", value: durationLabel, icon: Clock, color: "primary" },
                { label: "ENTRIES", value: playersLabel, icon: Users, color: "secondary" },
                { label: "DIFFICULTY", value: difficultyLabel, icon: Zap, color: "primary" },
                { label: "RATING", value: ratingLabel || "NEW", icon: Star, color: "secondary" },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-2xl glass border border-white/5 space-y-1 group/stat">
                  <div className="flex items-center gap-3">
                    <stat.icon className={cn("h-3.5 w-3.5 opacity-40 group-hover:opacity-100 transition-opacity", stat.color === "primary" ? "text-primary" : "text-secondary")} />
                    <span className="text-[8px] font-black tracking-widest text-muted-foreground/40 uppercase">{stat.label}</span>
                  </div>
                  <div className="text-sm font-black tracking-widest uppercase">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {ctaHref && (
            <Button asChild variant="neon" size="xl" className="rounded-2xl px-12 group-hover:scale-[1.05] transition-transform w-full sm:w-fit">
              <Link href={ctaHref}>
                {ctaLabel}
                <ChevronRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          )}
        </div>

        {/* Background decor */}
        <div className="absolute top-10 right-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
          <Activity className="h-40 w-40" />
        </div>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>
    </div>
  );
}
