"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsCard } from "@/components/profile/StatsCard";
import { BadgeShowcase } from "@/components/profile/BadgeShowcase";
import { ActivityFeed } from "@/components/profile/ActivityFeed";
import { TopTopics } from "@/components/profile/TopTopics";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Target, TrendingUp, BarChart3 } from "lucide-react";

interface PublicProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    async function loadProfile() {
      const resolvedParams = await params;
      setUserId(resolvedParams.id);

      try {
        const [profileRes, statsRes, badgesRes] = await Promise.all([
          fetch(`/api/users/${resolvedParams.id}`),
          fetch(`/api/users/${resolvedParams.id}/stats`),
          fetch(`/api/users/${resolvedParams.id}/badges`),
        ]);

        if (!profileRes.ok) {
          throw new Error("User not found");
        }

        const [profileData, statsData, badgesData] = await Promise.all([
          profileRes.json(),
          statsRes.json(),
          badgesRes.json(),
        ]);

        setProfile(profileData.data);
        setStats(statsData.data);
        setBadges([
          ...badgesData.data.earnedBadges,
          ...badgesData.data.availableBadges,
        ]);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load profile",
          variant: "destructive",
        });
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [params, router, toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile || !stats) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4">
        {/* Profile Header */}
        <ProfileHeader
          user={profile.user}
          isOwnProfile={false}
          // TODO: Add friend status and handlers
        />

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Attempts"
            value={stats.stats.totalAttempts}
            icon={Trophy}
          />
          <StatsCard
            title="Average Score"
            value={`${stats.stats.averageScore.toFixed(1)}%`}
            icon={BarChart3}
          />
          <StatsCard
            title="Pass Rate"
            value={`${stats.stats.passRate.toFixed(0)}%`}
            subtitle={`${stats.stats.passedQuizzes} passed`}
            icon={Target}
          />
          <StatsCard
            title="Current Streak"
            value={`${stats.stats.currentStreak} days`}
            subtitle={`Best: ${stats.stats.longestStreak} days`}
            icon={TrendingUp}
          />
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Badges */}
          <BadgeShowcase badges={badges} />

          {/* Top Topics */}
          <TopTopics topics={stats.topTopics || []} />
        </div>

        {/* Recent Activity */}
        <ActivityFeed attempts={stats.recentAttempts || []} />
      </div>
    </main>
  );
}

