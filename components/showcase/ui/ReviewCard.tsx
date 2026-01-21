"use client";

import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <div className={cn(
      "relative rounded-[2rem] p-8 glass-elevated border border-white/10 transition-all duration-300 hover:scale-[1.02] group",
      className
    )}>
      {/* Decorative Quote Icon */}
      <div className="absolute top-6 right-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Quote className="h-12 w-12" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border-2 border-white/10 shadow-glass">
            {reviewer.avatarUrl ? (
              <Image src={reviewer.avatarUrl} alt={reviewer.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xl bg-white/5">👤</div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm font-black uppercase tracking-tight">{reviewer.name}</p>
            {reviewer.role && <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{reviewer.role}</p>}
          </div>
        </div>

        <div className="sm:ml-auto flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className={cn(
              "h-4 w-4 transition-all duration-500",
              index < Math.round(rating) ? "fill-primary text-primary shadow-neon-cyan" : "text-white/10"
            )}
              fill={index < Math.round(rating) ? "currentColor" : "none"}
            />
          ))}
        </div>
      </div>

      <blockquote className="mt-6 text-sm font-medium leading-relaxed text-muted-foreground/90 relative z-10">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {dateLabel && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">{dateLabel}</p>
          <div className="h-1 w-1 rounded-full bg-primary/20" />
        </div>
      )}
    </div>
  );
}
