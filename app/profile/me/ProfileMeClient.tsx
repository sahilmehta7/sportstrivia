"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsCard } from "@/components/profile/StatsCard";
import { BadgeShowcase } from "@/components/profile/BadgeShowcase";
import { ActivityFeed } from "@/components/profile/ActivityFeed";
import { TopTopics } from "@/components/profile/TopTopics";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy,
  Target,
  TrendingUp,
  BarChart3,
  Save,
  Activity,
  LayoutDashboard,
  Settings,
  Award,
} from "lucide-react";

interface ProfileData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  role: string;
  favoriteTeams: string[];
  totalPoints: number | null;
  experienceTier: string | null;
  currentStreak: number;
  longestStreak: number;
  createdAt: string;
}

interface ProfileStats {
  stats: {
    totalAttempts: number;
    averageScore: number;
    passedQuizzes: number;
    passRate: number;
    currentStreak: number;
    longestStreak: number;
  };
  topTopics: Array<{
    id: string;
    successRate: number;
    questionsAnswered: number;
    questionsCorrect: number;
    topic: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  recentAttempts: Array<{
    id: string;
    score: number | null;
    passed: boolean | null;
    completedAt: string;
    quiz: {
      id: string;
      title: string;
      slug: string;
    };
  }>;
  leaderboardPositions: Array<{
    id: string;
    rank: number;
    bestScore: number;
    bestTime: number | null;
    quiz: {
      id: string;
      title: string;
      slug: string;
    };
  }>;
  perfectScores: number;
}

interface BadgeProgress {
  badge: {
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
  };
  earned: boolean;
  earnedAt: string | null;
}

interface ProfileMeClientProps {
  profile: ProfileData;
  stats: ProfileStats | null;
  badges: BadgeProgress[];
  personSchema: Record<string, unknown>;
}

export function ProfileMeClient({
  profile: initialProfile,
  stats,
  badges,
  personSchema,
}: ProfileMeClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: initialProfile.name ?? "",
    bio: initialProfile.bio ?? "",
    favoriteTeams: initialProfile.favoriteTeams.join(", "),
  });

  useEffect(() => {
    setProfile(initialProfile);
    setFormData({
      name: initialProfile.name ?? "",
      bio: initialProfile.bio ?? "",
      favoriteTeams: initialProfile.favoriteTeams.join(", "),
    });
  }, [initialProfile]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const updateData = {
        name: formData.name,
        bio: formData.bio || null,
        favoriteTeams: formData.favoriteTeams
          ? formData.favoriteTeams
              .split(",")
              .map((team) => team.trim())
              .filter(Boolean)
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

      if (result.data?.user) {
        const updatedUser = result.data.user as {
          id: string;
          name: string | null;
          email: string;
          image: string | null;
          bio: string | null;
          role: string;
          favoriteTeams?: string[];
          totalPoints: number | null;
          experienceTier: string | null;
          currentStreak: number;
          longestStreak: number;
          createdAt: string | Date;
        };

        const normalizedProfile: ProfileData = {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          image: updatedUser.image,
          bio: updatedUser.bio,
          role: updatedUser.role,
          favoriteTeams: updatedUser.favoriteTeams ?? [],
          totalPoints: updatedUser.totalPoints,
          experienceTier: updatedUser.experienceTier,
          currentStreak: updatedUser.currentStreak,
          longestStreak: updatedUser.longestStreak,
          createdAt:
            typeof updatedUser.createdAt === "string"
              ? updatedUser.createdAt
              : updatedUser.createdAt.toISOString(),
        };

        setProfile({
          ...normalizedProfile,
        });
        setFormData({
          name: normalizedProfile.name ?? "",
          bio: normalizedProfile.bio ?? "",
          favoriteTeams: normalizedProfile.favoriteTeams.join(", "),
        });
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      router.refresh();
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

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4">
        <ProfileHeader user={profile} isOwnProfile />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-2">
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {stats && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Total Quizzes"
                  value={stats.stats.totalAttempts}
                  icon={Trophy}
                  subtitle={`${stats.stats.passedQuizzes} passed`}
                />
                <StatsCard
                  title="Average Score"
                  value={`${stats.stats.averageScore.toFixed(1)}%`}
                  icon={BarChart3}
                  subtitle={`${stats.stats.passRate.toFixed(0)}% pass rate`}
                />
                <StatsCard
                  title="Total Points"
                  value={profile.totalPoints?.toLocaleString() || "0"}
                  icon={Target}
                  subtitle={profile.experienceTier || "ROOKIE"}
                />
                <StatsCard
                  title="Current Streak"
                  value={`${stats.stats.currentStreak} days`}
                  subtitle={`Best: ${stats.stats.longestStreak} days`}
                  icon={TrendingUp}
                />
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              {stats && <TopTopics topics={stats.topTopics || []} />}

              <Card>
                <CardHeader>
                  <CardTitle>Profile Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.bio && (
                    <div>
                      <p className="text-sm text-muted-foreground">Bio</p>
                      <p className="mt-1 text-sm">{profile.bio}</p>
                    </div>
                  )}
                  {profile.favoriteTeams.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Favorite Teams</p>
                      <p className="mt-1 text-sm">
                        {profile.favoriteTeams.join(", ")}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Member since</p>
                    <p className="mt-1 text-sm">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "long",
                        year: "numeric",
                      }).format(new Date(profile.createdAt))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="mt-1 text-sm">{profile.email}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            {stats && <ActivityFeed attempts={stats.recentAttempts || []} />}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6">
            <BadgeShowcase badges={badges} />

            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                  <CardDescription>Your overall quiz performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Total Questions Answered</p>
                      <p className="text-2xl font-bold">
                        {stats.stats.totalAttempts * 10 || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Accuracy Rate</p>
                      <p className="text-2xl font-bold text-primary">
                        {stats.stats.averageScore.toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Perfect Scores</p>
                      <p className="text-2xl font-bold">
                        {stats.perfectScores || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Badges Earned</p>
                      <p className="text-2xl font-bold">
                        {badges.filter((b) => b.earned || b.earnedAt).length} / {badges.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
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
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{profile.email}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Role</span>
                  <span className="font-medium">{profile.role}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Experience Tier</span>
                  <span className="font-medium">{profile.experienceTier || "ROOKIE"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Points</span>
                  <span className="font-medium">
                    {profile.totalPoints?.toLocaleString() || "0"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
    </main>
  );
}
