"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsCard } from "@/components/profile/StatsCard";
import { BadgeShowcase } from "@/components/profile/BadgeShowcase";
import { ActivityFeed } from "@/components/profile/ActivityFeed";
import { TopTopics } from "@/components/profile/TopTopics";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Target, TrendingUp, BarChart3, Save } from "lucide-react";

export default function MyProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    favoriteTeams: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, statsRes, badgesRes] = await Promise.all([
        fetch("/api/users/me"),
        fetch(`/api/users/me/stats`).catch(() => null),
        fetch(`/api/users/me/badges`).catch(() => null),
      ]);

      if (!profileRes.ok) {
        throw new Error("Failed to load profile");
      }

      const profileData = await profileRes.json();
      const statsData = statsRes ? await statsRes.json() : null;
      const badgesData = badgesRes ? await badgesRes.json() : null;

      setProfile(profileData.data.user);
      
      if (statsData?.data) {
        setStats(statsData.data);
      }

      if (badgesData?.data) {
        setBadges([
          ...(badgesData.data.earnedBadges || []),
          ...(badgesData.data.availableBadges || []),
        ]);
      }

      // Initialize form
      setFormData({
        name: profileData.data.user.name || "",
        bio: profileData.data.user.bio || "",
        favoriteTeams: (profileData.data.user.favoriteTeams || []).join(", "),
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        name: formData.name,
        bio: formData.bio || null,
        favoriteTeams: formData.favoriteTeams
          ? formData.favoriteTeams.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };

      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setEditMode(false);
      loadProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4">
        {/* Profile Header */}
        <ProfileHeader user={profile} isOwnProfile={true} />

        {/* Edit Form */}
        {editMode ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favoriteTeams">Favorite Teams</Label>
                  <Input
                    id="favoriteTeams"
                    value={formData.favoriteTeams}
                    onChange={(e) =>
                      setFormData({ ...formData, favoriteTeams: e.target.value })
                    }
                    placeholder="Team 1, Team 2, Team 3"
                  />
                  <p className="text-xs text-muted-foreground">
                    Comma-separated list of your favorite teams
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Grid */}
            {stats && (
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
            )}

            {/* Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              <BadgeShowcase badges={badges} />
              {stats && <TopTopics topics={stats.topTopics || []} />}
            </div>

            {/* Recent Activity */}
            {stats && <ActivityFeed attempts={stats.recentAttempts || []} />}

            {/* Account Info */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{profile.email}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="font-medium">
                    {new Intl.DateTimeFormat("en-US", {
                      month: "long",
                      year: "numeric",
                    }).format(new Date(profile.createdAt))}
                  </span>
                </div>
                {profile.favoriteTeams && profile.favoriteTeams.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Favorite Teams</span>
                    <span className="font-medium">
                      {profile.favoriteTeams.join(", ")}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Button */}
            <div className="flex justify-center">
              <Button onClick={() => setEditMode(true)}>
                Edit Profile
              </Button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

