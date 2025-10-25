import Link from "next/link";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getTextColor } from "@/lib/showcase-theme";

export type ShowcaseTopicCardVariant = "light" | "dark";

interface ShowcaseTopicCardProps {
  href: string;
  title: string;
  description?: string | null;
  accentDark?: string;
  accentLight?: string;
  variant?: ShowcaseTopicCardVariant;
  isFavorite?: boolean;
  className?: string;
}

const defaultDarkAccent = "#1f2937";
const defaultLightAccent = "#f97316";

export function ShowcaseTopicCard({
  href,
  title,
  description,
  accentDark = defaultDarkAccent,
  accentLight = defaultLightAccent,
  variant = "dark",
  isFavorite = false,
  className,
}: ShowcaseTopicCardProps) {
  const { theme } = useShowcaseTheme();
  const isLight = variant === "light";
  const accentColor = isLight ? accentLight : accentDark;
  const headingClass = isLight
    ? "text-slate-900 drop-shadow-[0_3px_12px_rgba(0,0,0,0.12)]"
    : getTextColor(theme, "primary");
  const descriptionClass = isLight ? "text-slate-700" : getTextColor(theme, "secondary");

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full w-[320px] flex-col overflow-hidden rounded-[2.5rem] border transition-transform duration-300 hover:-translate-y-1",
        isLight
          ? "border-white/60 bg-white text-slate-900 shadow-[0_32px_60px_-28px_rgba(255,100,0,0.3)]"
          : "border-white/10 bg-gradient-to-br from-black/85 via-slate-950 to-black/85 text-white shadow-[0_32px_72px_-30px_rgba(0,0,0,0.85)]",
        className
      )}
    >
      <div className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-black/15 text-white/80 backdrop-blur">
        <Heart className={cn("h-5 w-5", isFavorite ? "fill-rose-500 text-rose-500" : "")} />
      </div>

      <div
        className="relative flex flex-1 flex-col gap-6 px-7 py-8"
        style={{ backgroundColor: accentColor }}
      >
        <h3 className={cn("text-3xl font-black leading-tight tracking-tight", headingClass)}>
          {title}
        </h3>

        {description && (
          <p className={cn("text-sm leading-relaxed", descriptionClass)}>
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}
