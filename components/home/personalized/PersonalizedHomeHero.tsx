import { getGradientText, getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";
import type { PersonalizedHomeVariant } from "@/types/personalized-home";
import { cn } from "@/lib/utils";

type PersonalizedHomeHeroProps = {
  displayName: string;
  currentStreak: number;
  longestStreak: number;
  variant: PersonalizedHomeVariant;
};

export function PersonalizedHomeHero({
  displayName,
  currentStreak,
  longestStreak,
  variant,
}: PersonalizedHomeHeroProps) {
  const currentStreakLabel = `${currentStreak} ${currentStreak === 1 ? "day" : "days"}`;
  const longestStreakLabel = `${longestStreak} ${longestStreak === 1 ? "day" : "days"}`;

  return (
    <section
      data-variant={variant}
      className={cn(
        "relative overflow-hidden rounded-none p-4 sm:p-5",
        "motion-safe:animate-slide-up motion-reduce:animate-none",
        getSurfaceStyles("glass")
      )}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-16 -top-16 h-36 w-36 rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse-glow motion-reduce:animate-none" />
        <div className="absolute -right-10 bottom-0 h-32 w-32 rounded-full bg-accent/10 blur-3xl motion-safe:animate-pulse-glow motion-reduce:animate-none" />
      </div>

      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">
        For You
      </p>
      <h1 className={cn("mt-2 text-2xl font-black uppercase tracking-tight sm:text-3xl", getGradientText("editorial"))}>
        Welcome back, {displayName}
      </h1>
      <p className={cn("mt-1 text-xs font-medium sm:text-sm", getTextColor("secondary"))}>
        Personalized picks tuned to your momentum
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className={cn("rounded-none p-2.5", getSurfaceStyles("sunken"))}>
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-muted-foreground">
            Current Streak
          </p>
          <p className="mt-1 text-xl font-black tracking-tight">{currentStreakLabel}</p>
        </div>
        <div className={cn("rounded-none p-2.5", getSurfaceStyles("sunken"))}>
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-muted-foreground">
            Best Streak
          </p>
          <p className="mt-1 text-xl font-black tracking-tight">{longestStreakLabel}</p>
        </div>
      </div>
    </section>
  );
}
