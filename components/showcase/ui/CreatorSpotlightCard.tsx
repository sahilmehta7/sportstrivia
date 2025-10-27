"use client";

import Image from "next/image";
import { Users, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor, getChipStyles, getCardGlow } from "@/lib/showcase-theme";

interface CreatorSpotlightCardProps {
  name: string;
  bio?: string;
  followersLabel?: string;
  topQuizLabel?: string;
  avatarUrl?: string | null;
  accent?: string;
  href?: string;
}

export function ShowcaseCreatorSpotlightCard({
  name,
  bio,
  followersLabel = "12.3k followers",
  topQuizLabel = "Top quiz",
  avatarUrl,
  accent = "from-purple-500 via-indigo-500 to-blue-500",
  href,
}: CreatorSpotlightCardProps) {
  const { theme } = useShowcaseTheme();
  const textPrimary = getTextColor(theme, "primary");
  const textSecondary = getTextColor(theme, "secondary");

  const body = (
    <div
      className={cn(
        "relative overflow-hidden rounded-[2rem] px-6 py-8 text-white",
        getSurfaceStyles(theme, "raised"),
        getCardGlow(theme)
      )}
      style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
      data-theme={theme}
    >
      <div className={cn("absolute inset-0 opacity-80", accent)} />
        <div className="relative flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-white/40">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={name} fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl">🎤</div>
              )}
            </div>
            <div>
              <h3 className={cn("text-xl font-bold", textPrimary)}>{name}</h3>
              {bio && <p className={cn("text-sm", textSecondary)}>{bio}</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <span className={cn("inline-flex items-center gap-2 rounded-full px-4 py-2", getChipStyles("dark", "solid"))}>
            <Users className="h-4 w-4" /> {followersLabel}
          </span>
          <span className={cn("inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-white") }>
            <Trophy className="h-4 w-4" /> {topQuizLabel}
          </span>
        </div>

        <p className={cn("text-sm", textSecondary)}>
          Hosting weekly live battles, building binge-worthy trivia packs, and mentoring up-and-coming quiz creators.
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {body}
      </a>
    );
  }

  return body;
}
