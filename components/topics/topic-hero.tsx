"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap, ArrowRight, Sparkles, Trophy, Users, Star } from "lucide-react";
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
    <section className="relative mb-20">
      {/* Dynamic Background Glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl"
      >
        {/* Animated Mesh Gradient Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary-rgb),0.15),transparent_50%)]" />

        {backgroundImageUrl && (
          <div className="absolute inset-0 z-0">
            <Image
              src={backgroundImageUrl}
              alt=""
              fill
              className="object-cover opacity-20 transition-transform duration-700 hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </div>
        )}

        <div className="relative z-10 p-8 lg:p-20 flex flex-col lg:flex-row gap-16 lg:items-center">
          <div className="flex-1 space-y-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 items-center px-3 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  Topic Spotlight
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent lg:hidden" />
              </div>

              <h1 className={cn(
                "text-6xl lg:text-8xl font-black uppercase tracking-tight leading-[0.9] drop-shadow-2xl",
                getGradientText("neon")
              )}>
                {title}
              </h1>

              {subtitle && (
                <p className="max-w-2xl text-lg lg:text-xl font-medium text-muted-foreground/90 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="flex flex-wrap items-center gap-5"
            >
              {primaryCta && (
                <Button asChild variant="athletic" size="xl" className="rounded-full px-12 h-14 text-lg font-black group">
                  <a href={primaryCta.href}>
                    {primaryCta.label}
                    <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              )}
              {secondaryCta && (
                <Button asChild variant="glass" size="xl" className="rounded-full px-12 h-14 text-lg font-bold border-white/10 hover:bg-white/5">
                  <a href={secondaryCta.href}>{secondaryCta.label}</a>
                </Button>
              )}
            </motion.div>
          </div>

          {/* Stats Grid with modern cards */}
          {stats && stats.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="lg:w-[380px] grid grid-cols-2 gap-4"
            >
              {stats.map((stat, i) => (
                <div
                  key={stat.label}
                  className="group relative flex flex-col p-6 rounded-3xl bg-white/5 border border-white/10 transition-all hover:bg-white/10 hover:border-primary/30"
                >
                  <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">
                    {stat.label}
                  </dt>
                  <dd className="text-3xl font-black tracking-tighter text-white">
                    {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                  </dd>
                  <div className="absolute bottom-4 right-4 opacity-10 group-hover:opacity-30 transition-opacity">
                    {i === 0 ? <Users className="h-6 w-6" /> : i === 1 ? <Trophy className="h-6 w-6" /> : <Star className="h-6 w-6" />}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <div className="hidden lg:block relative">
              <div className="absolute -inset-10 bg-primary/20 blur-[100px] rounded-full" />
              <Sparkles className="h-40 w-40 text-primary opacity-20 animate-pulse" />
            </div>
          )}
        </div>

        {/* Bottom edge accent */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </motion.div>
    </section>
  );
}
