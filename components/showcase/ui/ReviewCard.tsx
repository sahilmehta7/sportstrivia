"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

interface ShowcaseReviewCardProps {
  reviewer: {
    name: string;
    avatarUrl?: string | null;
    role?: string;
  };
  rating: number;
  quote: string;
  dateLabel?: string;
  className?: string;
}

export function ShowcaseReviewCard({ reviewer, rating, quote, dateLabel, className }: ShowcaseReviewCardProps) {
  const { theme } = useShowcaseTheme();

  return (
    <div className={cn("rounded-[2rem] p-6", getSurfaceStyles(theme, "raised"), className)}>
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/20">
          {reviewer.avatarUrl ? (
            <Image src={reviewer.avatarUrl} alt={reviewer.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg">🙂</div>
          )}
        </div>
        <div>
          <p className={cn("text-sm font-semibold", getTextColor(theme, "primary"))}>{reviewer.name}</p>
          {reviewer.role && <p className={cn("text-xs", getTextColor(theme, "muted"))}>{reviewer.role}</p>}
        </div>
        <div className="ml-auto flex items-center gap-1 text-yellow-400">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className={cn("h-4 w-4", index < Math.round(rating) ? "fill-current" : "opacity-30")}
              fill={index < Math.round(rating) ? "currentColor" : "none"}
            />
          ))}
        </div>
      </div>

      <blockquote className={cn("mt-4 text-sm italic", getTextColor(theme, "secondary"))}>
        &ldquo;{quote}&rdquo;
      </blockquote>
      {dateLabel && <p className={cn("mt-3 text-xs", getTextColor(theme, "muted"))}>{dateLabel}</p>}
    </div>
  );
}
