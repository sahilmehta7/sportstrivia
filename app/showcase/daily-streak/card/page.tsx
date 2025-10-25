import { ShowcaseDailyStreakCard } from "@/components/quiz/ShowcaseDailyStreakCard";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { ShowcaseLayout } from "@/components/showcase/ShowcaseLayout";
import { fetchStreakData } from "../streak-data";

export default async function ShowcaseDailyStreakCardPage() {
  const streak = await fetchStreakData();

  return (
    <ShowcaseThemeProvider>
      <ShowcaseLayout
        title="Daily Streak Card"
        subtitle="Compare light and dark mode variants of the streak card component"
        badge="CARD SHOWCASE"
        variant="default"
      >
        <div className="flex w-full max-w-5xl flex-col gap-10 sm:flex-row sm:items-center sm:justify-between">
          <ShowcaseDailyStreakCard
            currentStreak={streak.currentStreak}
            completedDays={streak.completedDays}
            variant="light"
          />
          <ShowcaseDailyStreakCard
            currentStreak={streak.currentStreak}
            completedDays={streak.completedDays}
            variant="dark"
          />
        </div>
      </ShowcaseLayout>
    </ShowcaseThemeProvider>
  );
}
