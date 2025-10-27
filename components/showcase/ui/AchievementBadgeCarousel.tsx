"use client";

import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

export interface AchievementBadge {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  unlocked?: boolean;
}

interface AchievementBadgeCarouselProps {
  badges: AchievementBadge[];
  className?: string;
}

export function ShowcaseAchievementBadgeCarousel({ badges, className }: AchievementBadgeCarouselProps) {
  const { theme } = useShowcaseTheme();

  if (!badges.length) return null;

  return (
    <div className={cn("rounded-[2rem] p-5", getSurfaceStyles(theme, "base"), className)}>
      <h3 className={cn("mb-4 text-sm font-semibold uppercase tracking-[0.3em]", getTextColor(theme, "secondary"))}>
        Achievement Badges
      </h3>
      <div className="flex gap-4 overflow-x-auto">
        {badges.map((badge) => (
          <div
            key={badge.id}
            className={cn(
              "flex h-32 w-28 flex-col items-center justify-center gap-3 rounded-3xl border px-3 py-4 text-center",
              badge.unlocked ? "border-orange-400 bg-gradient-to-br from-orange-400/20 to-pink-500/20" : "border-white/10 bg-white/5"
            )}
          >
            <span className="text-3xl" aria-hidden="true">
              {badge.icon ?? (badge.unlocked ? "🏆" : "🔒")}
            </span>
            <div>
              <p className={cn("text-xs font-semibold", getTextColor(theme, "primary"))}>{badge.name}</p>
              {badge.description && (
                <p className={cn("mt-1 text-[10px]", getTextColor(theme, "muted"))}>{badge.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
