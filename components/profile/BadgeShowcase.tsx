"use client";

import { useState } from "react";
import { Award, Lock, Sparkles, ChevronRight, Trophy, Zap, MapPin, Grid, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// Define enums locally since client import might be flaky
const BadgeCategory = {
  GENERAL: "GENERAL",
  SPORT: "SPORT",
  TOPIC: "TOPIC",
  STREAK: "STREAK",
  SPECIAL: "SPECIAL"
} as const;

const BadgeRarity = {
  COMMON: "COMMON",
  RARE: "RARE",
  EPIC: "EPIC",
  LEGENDARY: "LEGENDARY",
  HIDDEN: "HIDDEN"
} as const;

type BadgeCategoryType = typeof BadgeCategory[keyof typeof BadgeCategory];
type BadgeRarityType = typeof BadgeRarity[keyof typeof BadgeRarity];

interface BadgeItem {
  badge: {
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
    category: BadgeCategoryType;
    rarity: BadgeRarityType;
  };
  earned: boolean;
  earnedAt?: Date | string | null;
}

interface BadgeShowcaseProps {
  badges: BadgeItem[];
}

const RARITY_STYLES: Record<string, { border: string; bg: string; glow: string; text: string }> = {
  [BadgeRarity.COMMON]: {
    border: "border-primary/20",
    bg: "bg-primary/5",
    glow: "shadow-none",
    text: "text-primary",
  },
  [BadgeRarity.RARE]: {
    border: "border-sky-500/40",
    bg: "bg-sky-500/10",
    glow: "shadow-lg shadow-sky-500/20",
    text: "text-sky-400",
  },
  [BadgeRarity.EPIC]: {
    border: "border-purple-500/50",
    bg: "bg-purple-500/10",
    glow: "shadow-lg shadow-purple-500/20",
    text: "text-purple-400",
  },
  [BadgeRarity.LEGENDARY]: {
    border: "border-amber-500/60",
    bg: "bg-amber-500/10",
    glow: "shadow-2xl shadow-amber-500/30",
    text: "text-amber-400",
  },
  [BadgeRarity.HIDDEN]: {
    border: "border-slate-800",
    bg: "bg-slate-900",
    glow: "shadow-none",
    text: "text-slate-500",
  },
};

const CATEGORIES = [
  { id: "ALL", label: "All Badges", icon: Grid },
  { id: BadgeCategory.GENERAL, label: "General", icon: Award },
  { id: BadgeCategory.SPORT, label: "Sports", icon: Trophy },
  { id: BadgeCategory.TOPIC, label: "Topics", icon: MapPin },
  { id: BadgeCategory.STREAK, label: "Streaks", icon: Flame },
];

export function BadgeShowcase({ badges }: BadgeShowcaseProps) {
  const [activeTab, setActiveTab] = useState("ALL");

  const filteredBadges = badges.filter((b) => {
    if (activeTab === "ALL") return true;
    return b.badge.category === activeTab;
  });

  // Sort: Earned first, then by rarity (Legendary -> Common)
  const sortedBadges = [...filteredBadges].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    const rarityOrder = { LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1, HIDDEN: 0 };
    return rarityOrder[b.badge.rarity] - rarityOrder[a.badge.rarity];
  });

  const earnedCount = badges.filter(b => b.earned).length;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <div className="h-6 w-1 rounded-full bg-secondary shadow-[0_0_10px_rgba(var(--secondary),0.5)]" />
            <h4 className="text-2xl font-black uppercase tracking-tight">Achievement Matrix</h4>
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest pl-5">
            {earnedCount} OF {badges.length} ARTIFACTS RECOVERED
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto gap-2 p-1 bg-secondary/5 rounded-xl border border-white/5 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap",
                activeTab === cat.id
                  ? "bg-secondary text-secondary-foreground shadow-md"
                  : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
              )}
            >
              <cat.icon className="w-3 h-3" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <motion.div
        layout
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence mode="popLayout">
          {sortedBadges.map(({ badge, earned, earnedAt }) => {
            const styles = RARITY_STYLES[badge.rarity] || RARITY_STYLES.COMMON;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={badge.id}
                className={cn(
                  "group relative overflow-hidden rounded-[2rem] p-6 transition-all duration-300",
                  "backdrop-blur-sm border",
                  earned
                    ? styles.border
                    : "border-white/5 bg-white/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100",
                  earned && styles.glow,
                  earned ? "glass-elevated" : "glass"
                )}
              >
                {/* Background Glow */}
                {earned && (
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500",
                    styles.bg
                  )} />
                )}

                <div className="relative flex flex-col items-center text-center gap-5">
                  {/* Icon Container */}
                  <div className={cn(
                    "relative p-1 rounded-2xl border transition-transform duration-500 group-hover:rotate-[5deg]",
                    earned ? styles.border : "border-white/10",
                    "glass"
                  )}>
                    <div className={cn(
                      "h-20 w-20 rounded-xl overflow-hidden flex items-center justify-center relative",
                      styles.bg
                    )}>
                      {badge.imageUrl ? (
                        <Image src={badge.imageUrl} alt={badge.name} fill className="object-cover" />
                      ) : (
                        earned ? (
                          <Award className={cn("h-10 w-10 drop-shadow-lg", styles.text)} />
                        ) : (
                          <Lock className="h-8 w-8 text-muted-foreground/40" />
                        )
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-center gap-2">
                      <h4 className={cn(
                        "text-sm font-black uppercase tracking-widest",
                        earned ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {badge.name}
                      </h4>
                      {/* Rarity Tag */}
                      {badge.rarity !== 'COMMON' && (
                        <span className={cn(
                          "text-[8px] px-1.5 py-0.5 rounded-full border bg-black/50 font-bold",
                          styles.border, styles.text
                        )}>
                          {badge.rarity}
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] font-medium leading-relaxed text-muted-foreground uppercase opacity-80 max-w-[200px] mx-auto">
                      {badge.description}
                    </p>
                  </div>

                  {/* Footer */}
                  {earned ? (
                    <div className={cn(
                      "flex items-center gap-1.5 px-3 py-1 rounded-full glass border text-[8px] font-black uppercase tracking-widest",
                      styles.border, styles.text
                    )}>
                      <Sparkles className="h-2.5 w-2.5" />
                      RECOVERED {formatDate(earnedAt)}
                    </div>
                  ) : (
                    <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1">
                      LOCKED <ChevronRight className="h-2 w-2" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {sortedBadges.length === 0 && (
        <div className="py-20 text-center space-y-4 rounded-[3rem] glass border border-dashed border-white/10">
          <Award className="h-12 w-12 mx-auto text-muted-foreground/20" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
            NO ARTIFACTS FOUND IN THIS SECTOR
          </p>
        </div>
      )}
    </div>
  );
}
