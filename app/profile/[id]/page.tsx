"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsCard } from "@/components/profile/StatsCard";
import { BadgeShowcase } from "@/components/profile/BadgeShowcase";
import { ActivityFeed } from "@/components/profile/ActivityFeed";
import { TopTopics } from "@/components/profile/TopTopics";
import { CreateChallengeModal } from "@/components/challenges/CreateChallengeModal";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Target, TrendingUp, BarChart3, UserPlus, Swords, UserMinus } from "lucide-react";

interface PublicProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [isFriend, setIsFriend] = useState(false);
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const resolvedParams = await params;
      setUserId(resolvedParams.id);

      try {
        const fetchPromises = [
          fetch(`/api/users/${resolvedParams.id}`),
          fetch(`/api/users/${resolvedParams.id}/stats`),
          fetch(`/api/users/${resolvedParams.id}/badges`),
        ];

        // Check friendship status if logged in
        if (session?.user) {
          fetchPromises.push(fetch("/api/friends?type=friends"));
        }

        const results = await Promise.all(fetchPromises);
        const [profileRes, statsRes, badgesRes, friendsRes] = results;

        if (!profileRes.ok) {
          throw new Error("User not found");
        }

        const [profileData, statsData, badgesData, friendsData] = await Promise.all([
          profileRes.json(),
          statsRes.json(),
          badgesRes.json(),
          friendsRes ? friendsRes.json() : Promise.resolve(null),
        ]);

        setProfile(profileData.data);
        setStats(statsData.data);
        setBadges([
          ...badgesData.data.earnedBadges,
          ...badgesData.data.availableBadges,
        ]);

        // Check if this user is a friend
        if (friendsData?.data?.friendships) {
          const friendship = friendsData.data.friendships.find(
            (f: any) => f.friend.id === resolvedParams.id
          );
          setIsFriend(!!friendship);
          setFriendshipId(friendship?.id || null);
        }
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
  }, [params, router, toast, session]);

  const handleSendFriendRequest = async () => {
    if (!profile?.user?.email) return;

    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendEmail: profile.user.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send friend request");
      }

      toast({
        title: "Success",
        description: "Friend request sent successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendshipId) return;

    if (!confirm("Are you sure you want to remove this friend?")) {
      return;
    }

    try {
      const response = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to remove friend");
      }

      toast({
        title: "Success",
        description: "Friend removed successfully",
      });

      setIsFriend(false);
      setFriendshipId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

  const isOwnProfile = session?.user?.id === userId;

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4">
        {/* Profile Header */}
        <ProfileHeader
          user={profile.user}
          isOwnProfile={false}
        />

        {/* Action Buttons for Other Users */}
        {session?.user && !isOwnProfile && (
          <Card>
            <CardContent className="flex flex-wrap gap-3 pt-6">
              {!isFriend && (
                <Button onClick={handleSendFriendRequest}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Friend
                </Button>
              )}
              {isFriend && (
                <>
                  <Button onClick={() => setShowChallengeModal(true)}>
                    <Swords className="mr-2 h-4 w-4" />
                    Challenge to Quiz
                  </Button>
                  <Button variant="outline" onClick={handleRemoveFriend}>
                    <UserMinus className="mr-2 h-4 w-4" />
                    Remove Friend
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

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

      <CreateChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        onSuccess={() => setShowChallengeModal(false)}
        preselectedFriendId={userId}
      />
    </main>
  );
}

