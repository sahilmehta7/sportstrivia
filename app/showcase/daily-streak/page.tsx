import { ShowcaseDailyStreak } from "@/components/quiz/ShowcaseDailyStreak";
import { fetchStreakData } from "./streak-data";

export default async function ShowcaseDailyStreakPage() {
  const streak = await fetchStreakData();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-amber-500 px-4 py-12 sm:px-6 lg:py-16">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-emerald-400/40 blur-[120px]" />
        <div className="absolute right-12 top-12 h-64 w-64 rounded-full bg-pink-500/40 blur-[100px]" />
        <div className="absolute bottom-12 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-500/30 blur-[90px]" />
      </div>

      <ShowcaseDailyStreak
        currentStreak={streak.currentStreak}
        bestStreak={streak.longestStreak}
        completedDays={streak.completedDays}
        message={streak.currentStreak > 0 ? "Keep the momentum!" : "Start your streak today"}
      />
    </div>
  );
}
