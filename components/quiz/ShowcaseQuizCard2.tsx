"use client";

import Image from "next/image";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoachInfo {
  name: string;
  avatarUrl?: string | null;
}

export interface ShowcaseQuizCard2Props {
  title: string;
  category: string;
  durationLabel: string;
  difficultyLabel: string;
  coach: CoachInfo;
  coverImageUrl?: string | null;
  isBookmarked?: boolean;
  accent?: string;
  className?: string;
}

export function ShowcaseQuizCard2({
  title,
  category,
  durationLabel,
  difficultyLabel,
  coach,
  coverImageUrl,
  isBookmarked = false,
  accent = "from-orange-500/80 to-orange-400/20",
  className,
}: ShowcaseQuizCard2Props) {
  return (
    <div
      className={cn(
        "group relative w-[280px] overflow-hidden rounded-[2rem] border border-white/40 bg-white text-slate-900 shadow-[0_24px_60px_-35px_rgba(249,115,22,0.45)] transition-transform duration-300 hover:-translate-y-1",
        className
      )}
    >
      <div className={cn("absolute inset-0 rounded-[2rem] border border-transparent bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100", accent)} />
      <div className="relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-white">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 280px, 80vw"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 text-5xl">
              🏆
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/10 to-black/65" />
          <div className="absolute inset-x-4 top-4 flex items-center justify-between">
            <span className="inline-flex items-center rounded-full bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white">
              {category}
            </span>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white transition hover:bg-black/70"
              aria-label={isBookmarked ? "Remove from favorites" : "Add to favorites"}
            >
              <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-white")} />
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 px-6 pb-6 pt-5">
          <div>
            <h3 className="text-lg font-semibold leading-tight">{title}</h3>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <span>{durationLabel}</span>
              <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
              <span>{difficultyLabel}</span>
            </div>
          </div>

          <div className="mt-auto flex items-center gap-3 text-sm text-slate-600">
            <div className="relative h-9 w-9 overflow-hidden rounded-full bg-slate-200">
              {coach.avatarUrl ? (
                <Image
                  src={coach.avatarUrl}
                  alt={coach.name}
                  fill
                  className="object-cover"
                  sizes="36px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase text-slate-500">
                  {coach.name.slice(0, 2)}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Coach</span>
              <span className="text-sm font-medium text-slate-700">{coach.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
