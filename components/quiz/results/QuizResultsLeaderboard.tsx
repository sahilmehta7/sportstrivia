import type { ShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import type { QuizResultsLeaderboardProps } from "./types";
import { cn } from "@/lib/utils";
import { getTextColor, getAccentColor } from "@/lib/showcase-theme";
import { Coins } from "lucide-react";

export function QuizResultsLeaderboard({
  entries,
  theme,
}: QuizResultsLeaderboardProps) {
  if (!entries.length) {
    return (
      <div
        className={cn(
          "rounded-2xl border p-6 text-center text-sm",
          theme === "light"
            ? "border-slate-200/50 bg-white/60 text-slate-600"
            : "border-white/10 bg-white/5 text-white/70",
        )}
      >
        Leaderboard data is not available yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, index) => (
        <div
          key={`${entry.userId}-${index}`}
          className={cn(
            "flex items-center gap-3 rounded-2xl border p-3 backdrop-blur-sm",
            theme === "light"
              ? "border-slate-200/50 bg-white/60 shadow-[inset_0_1px_0_rgba(0,0,0,0.05)]"
              : "border-white/10 bg-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]",
          )}
        >
          <div className="relative">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full",
                theme === "light" ? "bg-slate-100" : "bg-white/10",
              )}
            >
              {entry.userImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={entry.userImage}
                  alt={entry.userName || "User"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className={cn("text-sm font-medium", getTextColor(theme, "muted"))}>
                  {(entry.userName || "U").charAt(0)}
                </span>
              )}
            </div>
            <div
              className={cn(
                "absolute -bottom-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-lg",
                theme === "light"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600"
                  : "bg-gradient-to-r from-amber-400 to-pink-500",
              )}
            >
              {(index + 1).toString().padStart(2, "0")}
            </div>
          </div>

          <div className="flex-1">
            <p className={cn("font-semibold", getTextColor(theme, "primary"))}>{entry.userName || "Anonymous"}</p>
            <p className={cn("text-sm", getTextColor(theme, "muted"))}>
              {(entry.totalPoints ?? entry.score ?? 0)} points
            </p>
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-1 rounded-lg px-2 py-1 backdrop-blur-sm",
              theme === "light"
                ? "border border-blue-200/50 bg-gradient-to-r from-blue-100/80 to-purple-100/80"
                : "border border-amber-400/30 bg-gradient-to-r from-amber-400/20 to-pink-500/20",
            )}
          >
            <Coins className={cn("h-3 w-3", getAccentColor(theme, "primary"))} />
            <span className={cn("text-sm font-semibold", getTextColor(theme, "primary"))}>
              {entry.totalPoints ?? entry.score ?? 0}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}


