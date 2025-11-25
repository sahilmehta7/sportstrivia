import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getUserProfileInfo,
  getUserProfileStats,
  getUserBadgeProgressData,
} from "@/lib/services/user-profile.service";
import { ProfileMeClient } from "./ProfileMeClient";

export default async function MyProfilePage() {
  const session = await auth();

  // Middleware ensures session exists, so we can safely use it
  const userId = session!.user!.id;

  const [profileInfo, statsData, badgeProgress] = await Promise.all([
    getUserProfileInfo(userId),
    getUserProfileStats(userId).catch(() => null),
    getUserBadgeProgressData(userId).catch(() => []),
  ]);

  if (!profileInfo) {
    redirect("/profile");
  }

  const profile = {
    ...profileInfo,
    favoriteTeams: profileInfo.favoriteTeams ?? [],
    createdAt: profileInfo.createdAt.toISOString(),
  };

  const stats = statsData
    ? {
        stats: statsData.stats,
        topTopics: statsData.topTopics.map((topic) => ({
          ...topic,
          successRate: Number(topic.successRate),
          questionsAnswered: Number(topic.questionsAnswered),
          questionsCorrect: Number(topic.questionsCorrect),
        })),
        recentAttempts: statsData.recentAttempts.map((attempt) => ({
          ...attempt,
          score: attempt.score === null ? null : Number(attempt.score),
          completedAt: attempt.completedAt.toISOString(),
        })),
        leaderboardPositions: statsData.leaderboardPositions.map((entry) => ({
          ...entry,
          bestScore: Number(entry.bestScore),
          bestTime: entry.bestTime === null ? null : Number(entry.bestTime),
        })),
        perfectScores: statsData.perfectScores,
      }
    : null;

  const badges = badgeProgress.map((progress) => ({
    badge: {
      id: progress.badge.id,
      name: progress.badge.name,
      description: progress.badge.description,
      imageUrl: progress.badge.imageUrl,
    },
    earned: progress.earned,
    earnedAt: progress.earnedAt ? progress.earnedAt.toISOString() : null,
  }));

  return (
    <ProfileMeClient
      profile={profile}
      stats={stats}
      badges={badges}
    />
  );
}

