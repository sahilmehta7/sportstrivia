"use client";

import { cn } from "@/lib/utils";
import { getSportGradient } from "@/lib/quiz-formatters";
import { glassText } from "@/components/showcase/ui/typography";

interface ShowcaseQuizCardProps {
  title: string;
  badgeLabel?: string;
  durationLabel: string;
  playersLabel: string;
  accent?: string;
  coverImageUrl?: string | null;
  className?: string;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function ShowcaseQuizCard({
  title,
  badgeLabel,
  durationLabel,
  playersLabel,
  accent,
  coverImageUrl,
  className,
}: ShowcaseQuizCardProps) {
  const gradient = accent ?? getSportGradient(undefined, hashString(`${title}`));
  const label = (badgeLabel ?? "Featured").toUpperCase();

  // Use design tokens for consistent SSR/CSR rendering
  const cardClasses = cn(
    "flex h-full flex-col overflow-hidden rounded-[2.25rem] shadow-lg",
    "border border-border bg-card text-card-foreground"
  );

  const badgeClasses = cn(glassText.badge);

  const titleClasses = cn("mt-2 leading-tight", glassText.h3);

  const infoClasses = cn(
    "mt-6 rounded-2xl px-4 py-3 text-xs",
    "border border-border bg-muted text-muted-foreground"
  );

  return (
    <div className={cn("w-[300px]", className)}>
      <div className={cardClasses}>
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <div className={cn("absolute inset-0", `bg-gradient-to-br ${gradient}`)} />
          {coverImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${coverImageUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/60" />
        </div>
        <div className="flex flex-1 flex-col justify-between px-5 pb-5 pt-4">
          <div className="text-left">
            <p className={badgeClasses}>{label}</p>
            <p className={titleClasses}>{title}</p>
          </div>

          <div className={infoClasses}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="text-base">⏱️</span>
                {durationLabel}
              </span>
              <span className="flex items-center gap-2">
                {playersLabel}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M8 11a3 3 0 1 1 3-3 3 3 0 0 1-3 3Zm8-6a3 3 0 1 0 3 3 3 3 0 0 0-3-3Zm0 7a4.94 4.94 0 0 0-3.61 1.59A6.95 6.95 0 0 1 12 15.76 6.95 6.95 0 0 1 9.61 13.6 4.94 4.94 0 0 0 6 12a5 5 0 0 0-5 5 1 1 0 0 0 1 1h12a6.94 6.94 0 0 1 1.42-4h2.16A6.94 6.94 0 0 1 19 18h4a1 1 0 0 0 1-1 5 5 0 0 0-5-5Z" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
