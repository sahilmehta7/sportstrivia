"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

interface ShowcaseSplitFeaturePanelProps {
  title: string;
  description: string;
  points?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
  reverse?: boolean;
  className?: string;
}

export function ShowcaseSplitFeaturePanel({
  title,
  description,
  points = [],
  ctaLabel,
  ctaHref = "#",
  imageUrl,
  reverse = false,
  className,
}: ShowcaseSplitFeaturePanelProps) {
  const { theme } = useShowcaseTheme();

  return (
    <div
      className={cn(
        "grid gap-8 overflow-hidden rounded-[2.5rem] p-8 md:grid-cols-2",
        getSurfaceStyles(theme, "raised"),
        reverse && "md:[&>*:first-child]:order-2",
        className
      )}
    >
      <div className="flex flex-col justify-center gap-5">
        <h3 className={cn("text-3xl font-black", getTextColor(theme, "primary"))}>{title}</h3>
        <p className={cn("text-sm", getTextColor(theme, "secondary"))}>{description}</p>
        {points.length > 0 && (
          <ul className="space-y-2 text-sm">
            {points.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span>✨</span>
                <span className={getTextColor(theme, "secondary")}>{point}</span>
              </li>
            ))}
          </ul>
        )}
        {ctaLabel && (
          <Button asChild className="mt-2 w-fit rounded-full uppercase tracking-[0.3em]">
            <a href={ctaHref}>{ctaLabel}</a>
          </Button>
        )}
      </div>
      <div className="relative h-64 rounded-[2rem] bg-gradient-to-br from-cyan-500/20 to-purple-500/20">
        {imageUrl && (
          <Image src={imageUrl} alt={title} fill className="rounded-[2rem] object-cover" />
        )}
      </div>
    </div>
  );
}
