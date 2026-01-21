"use client";

import { Award, Lock, Sparkles, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface BadgeItem {
  badge: {
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
  };
  earned: boolean;
  earnedAt?: Date | string | null;
}

interface BadgeShowcaseProps {
  badges: BadgeItem[];
}

export function BadgeShowcase({ badges }: BadgeShowcaseProps) {
  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <div className="h-6 w-1 rounded-full bg-secondary shadow-neon-magenta" />
            <h4 className="text-2xl font-black uppercase tracking-tight">Achievement Matrix</h4>
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest pl-5">
            {earnedBadges.length} OF {badges.length} ARTIFACTS RECOVERED
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {earnedBadges.map(({ badge, earnedAt }) => (
          <div
            key={badge.id}
            className="group relative overflow-hidden rounded-[2.5rem] p-8 glass-elevated border border-primary/20 shadow-neon-cyan/5 transition-all duration-300 hover:scale-[1.05] hover:border-primary/40"
          >
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="relative flex flex-col items-center text-center gap-6">
              <div className="relative p-1 rounded-2xl glass border border-white/10 shadow-glass group-hover:rotate-[10deg] transition-transform duration-500">
                <div className="h-20 w-20 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center relative">
                  {badge.imageUrl ? (
                    <Image src={badge.imageUrl} alt={badge.name} fill className="object-cover" />
                  ) : (
                    <Award className="h-10 w-10 text-primary drop-shadow-neon-cyan" />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-widest text-foreground">{badge.name}</h4>
                <p className="text-[10px] font-medium leading-relaxed text-muted-foreground uppercase opacity-80">
                  {badge.description}
                </p>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/5 text-[8px] font-black uppercase tracking-widest text-primary">
                <Sparkles className="h-3 w-3" />
                RECOVERED {formatDate(earnedAt)}
              </div>
            </div>
          </div>
        ))}

        {lockedBadges.map(({ badge }) => (
          <div
            key={badge.id}
            className="relative overflow-hidden rounded-[2.5rem] p-8 glass border border-white/5 opacity-40 grayscale group hover:grayscale-0 transition-all duration-500"
          >
            <div className="relative flex flex-col items-center text-center gap-6">
              <div className="p-1 rounded-2xl glass border border-white/5">
                <div className="h-20 w-20 rounded-xl bg-white/5 flex items-center justify-center">
                  <Lock className="h-8 w-8 text-muted-foreground/40" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{badge.name}</h4>
                <p className="text-[10px] font-medium leading-relaxed text-muted-foreground/60 uppercase">
                  CLASSIFIED MISSION DATA
                </p>
              </div>

              <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1">
                LOCKED <ChevronRight className="h-2 w-2" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {badges.length === 0 && (
        <div className="py-20 text-center space-y-4 rounded-[3rem] glass border border-dashed border-white/10">
          <Award className="h-12 w-12 mx-auto text-muted-foreground/20" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">NO ARTIFACTS DETECTED</p>
        </div>
      )}
    </div>
  );
}
