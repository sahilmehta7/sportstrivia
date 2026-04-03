import Link from "next/link";
import { ArrowRight, Trophy } from "lucide-react";
import type { PersonalizedHomeDailyChallenge } from "@/types/personalized-home";
import { getChipStyles, getGradientText, getSurfaceStyles } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";

type PersonalizedDailyChallengePanelProps = {
  challenge: PersonalizedHomeDailyChallenge;
};

export function PersonalizedDailyChallengePanel({ challenge }: PersonalizedDailyChallengePanelProps) {
  const statusLabel = challenge.isCompleted ? "Completed" : "Live";
  const actionLabel = challenge.isCompleted ? "View Result" : "Play Now";

  return (
    <section className={cn("relative overflow-hidden rounded-none p-5 sm:p-6", getSurfaceStyles("raised"))}>
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-1 bg-primary" />
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px] font-black tracking-[0.2em]", getChipStyles("outline"))}>
              Daily Challenge
            </span>
            <span className={cn("text-[10px] font-black tracking-[0.2em]", getChipStyles(challenge.isCompleted ? "ghost" : "accent"))}>
              {statusLabel}
            </span>
          </div>

          <h2 className={cn("mt-3 text-2xl font-black uppercase tracking-tight sm:text-3xl", getGradientText("editorial"))}>
            {challenge.displayName}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Puzzle #{challenge.gameNumber.toString().padStart(3, "0")}
          </p>
          {challenge.isCompleted ? (
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.16em] text-primary">
              <Trophy className="h-3.5 w-3.5" />
              {challenge.solved ? `Solved in ${challenge.guessCount ?? 0}/${challenge.maxGuesses}` : "Completed"}
            </p>
          ) : null}
        </div>

        <Link
          href="/daily"
          className="inline-flex min-h-touch items-center rounded-none border border-primary/30 bg-primary/10 px-4 text-xs font-black uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {actionLabel}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
