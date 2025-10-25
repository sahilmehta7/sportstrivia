import { headers } from "next/headers";

interface StreakApiResponse {
  stats: {
    currentStreak: number;
    longestStreak: number;
  };
  recentAttempts: { completedAt: string | null }[];
}

export async function fetchStreakData(): Promise<{
  currentStreak: number;
  longestStreak: number;
  completedDays: number[];
}> {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "https";
  const cookieHeader = headersList.get("cookie") ?? "";

  if (!host) {
    return { currentStreak: 0, longestStreak: 0, completedDays: [] };
  }

  try {
    const res = await fetch(`${protocol}://${host}/api/users/me/stats`, {
      cache: "no-store",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
    });

    if (!res.ok) {
      return { currentStreak: 0, longestStreak: 0, completedDays: [] };
    }

    const data = (await res.json())?.data as StreakApiResponse;

    if (!data) {
      return { currentStreak: 0, longestStreak: 0, completedDays: [] };
    }

    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday=0
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const completedSet = new Set<number>();
    for (const attempt of data.recentAttempts ?? []) {
      if (!attempt.completedAt) continue;
      const attemptDate = new Date(attempt.completedAt);
      const normalized = new Date(
        attemptDate.getFullYear(),
        attemptDate.getMonth(),
        attemptDate.getDate()
      );
      const diff = Math.floor((normalized.getTime() - monday.getTime()) / 86400000);
      if (diff >= 0 && diff < 7) {
        completedSet.add(diff + 1); // 1..7
      }
    }

    return {
      currentStreak: data.stats.currentStreak ?? 0,
      longestStreak: data.stats.longestStreak ?? 0,
      completedDays: Array.from(completedSet.values()).sort((a, b) => a - b),
    };
  } catch (error) {
    console.error("Failed to load streak data", error);
    return { currentStreak: 0, longestStreak: 0, completedDays: [] };
  }
}
