import { ShowcaseDailyStreak } from "@/components/quiz/ShowcaseDailyStreak";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ShowcaseLayout } from "@/components/showcase/ShowcaseLayout";
import { fetchStreakData } from "./streak-data";

export default async function ShowcaseDailyStreakPage() {
  const streak = await fetchStreakData();

  return (
    <ShowcaseThemeProvider>
      <ShowcaseLayout
        title="Daily Streak"
        subtitle="Track your learning progress with daily quiz streaks"
        badge="STREAK SHOWCASE"
        variant="default"
      >
        <ShowcaseDailyStreak
          currentStreak={streak.currentStreak}
          bestStreak={streak.longestStreak}
          completedDays={streak.completedDays}
          message={streak.currentStreak > 0 ? "Keep the momentum!" : "Start your streak today"}
        />
      </ShowcaseLayout>
    </ShowcaseThemeProvider>
  );
}
