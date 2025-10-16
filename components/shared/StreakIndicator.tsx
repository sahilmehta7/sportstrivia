import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakIndicatorProps {
  currentStreak: number;
  longestStreak?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: { icon: "h-3 w-3", text: "text-sm" },
  md: { icon: "h-4 w-4", text: "text-base" },
  lg: { icon: "h-5 w-5", text: "text-lg" },
};

export function StreakIndicator({
  currentStreak,
  longestStreak,
  size = "md",
  showLabel = false,
  className,
}: StreakIndicatorProps) {
  if (currentStreak === 0 && !longestStreak) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {currentStreak > 0 && (
        <>
          <Flame
            className={cn(
              "text-orange-500",
              sizeClasses[size].icon
            )}
          />
          <span className={cn("font-semibold text-orange-600", sizeClasses[size].text)}>
            {currentStreak}
          </span>
          {showLabel && (
            <span className={cn("text-muted-foreground", sizeClasses[size].text)}>
              day streak
            </span>
          )}
        </>
      )}
      {longestStreak && longestStreak > 0 && (
        <span className={cn("text-muted-foreground", sizeClasses[size].text)}>
          (best: {longestStreak})
        </span>
      )}
    </div>
  );
}

