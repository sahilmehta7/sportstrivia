"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

interface TopicHeroProps {
  title: string;
  subtitle?: string;
  backgroundImageUrl?: string | null;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  stats?: Array<{ label: string; value: string | number }>;
}

export function TopicHero({
  title,
  subtitle,
  backgroundImageUrl,
  primaryCta,
  secondaryCta,
  stats,
}: TopicHeroProps) {
  return (
    <section className="relative mb-16 group">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary blur-2xl opacity-5 group-hover:opacity-10 transition-opacity rounded-[3rem]" />

      <div className="relative overflow-hidden rounded-[3rem] glass-elevated border border-white/10">
        {backgroundImageUrl && (
          <div className="absolute inset-0">
            <Image
              src={backgroundImageUrl}
              alt=""
              fill
              className="object-cover opacity-[0.07] grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
          </div>
        )}

        <div className="relative z-10 p-10 lg:p-16 flex flex-col lg:flex-row gap-12 lg:items-center">
          <div className="flex-1 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 rounded-full bg-primary shadow-neon-cyan" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">SECTOR DEFINED</span>
              </div>
              <h1 className={cn("text-5xl lg:text-7xl font-black uppercase tracking-tighter leading-tight", getGradientText("neon"))}>
                {title}
              </h1>
              {subtitle && (
                <p className="max-w-2xl text-base lg:text-lg font-bold tracking-tight text-muted-foreground/80 uppercase">
                  {subtitle}
                </p>
              )}
            </div>

            {(primaryCta || secondaryCta) && (
              <div className="flex flex-wrap items-center gap-4">
                {primaryCta && (
                  <Button asChild variant="athletic" size="xl" className="rounded-2xl px-10">
                    <a href={primaryCta.href}>
                      {primaryCta.label}
                      <ArrowRight className="ml-3 h-5 w-5" />
                    </a>
                  </Button>
                )}
                {secondaryCta && (
                  <Button asChild variant="glass" size="xl" className="rounded-2xl px-10 border-white/5 hover:border-white/20">
                    <a href={secondaryCta.href}>{secondaryCta.label}</a>
                  </Button>
                )}
              </div>
            )}
          </div>

          {stats && stats.length > 0 && (
            <div className="lg:w-80 grid gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="relative group/stat">
                  <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover/stat:opacity-100 transition-opacity" />
                  <div className="p-6 rounded-[2rem] glass border border-white/5 space-y-2 group-hover/stat:bg-white/5 transition-all">
                    <dt className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{stat.label}</dt>
                    <dd className="text-3xl font-black tracking-tighter text-primary">
                      {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                    </dd>
                  </div>
                  <div className="absolute top-4 right-6 opacity-5 group-hover/stat:opacity-10 transition-opacity">
                    <Zap className="h-10 w-10 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Decorative UI elements */}
        <div className="absolute top-10 right-10 opacity-5 pointer-events-none">
          <Sparkles className="h-20 w-20 text-secondary" />
        </div>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
      </div>
    </section>
  );
}
