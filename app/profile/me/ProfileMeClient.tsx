"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsCard } from "@/components/profile/StatsCard";
import { BadgeShowcase } from "@/components/profile/BadgeShowcase";
import { ActivityFeed } from "@/components/profile/ActivityFeed";
// import { TopTopics } from "@/components/profile/TopTopics";
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
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { glassText } from "@/components/showcase/ui/typography";
import { ShowcaseTopicWiseStats } from "@/showcase/components";
import { ShowcaseProgressTrackerRibbon } from "@/components/showcase/ui/ProgressTrackerRibbon";
import { pointsForLevel } from "@/lib/config/gamification";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import Link from "next/link";
import { formatPlayerCount } from "@/lib/quiz-formatters";

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
  level?: number;
  tierName?: string | null;
  levelCurrentPointsRequired?: number;
  nextLevelPoints?: number | null;
  levelProgressPoints?: number;
  levelSpanPoints?: number;
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
      emoji?: string | null;
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

  const mappedTopTopics = (stats?.topTopics ?? []).map((t) => ({
    id: t.id,
    label: t.topic.name,
    accuracyPercent: Math.round(t.successRate),
    quizzesTaken: t.questionsAnswered,
    icon: t.topic.emoji ?? "🏷️",
  }));

  return (
    <main className="relative min-h-screen bg-background py-8">
      {/* Background blur circles */}
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-12 top-12 h-64 w-64 rounded-full bg-emerald-500/20 blur-[100px]" />
        <div className="absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-purple-500/20 blur-[90px]" />
      </div>
      
      <div className="relative mx-auto max-w-6xl space-y-8 px-4">
        <ProfileHeader user={profile} isOwnProfile />

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className={cn(
            "grid w-full grid-cols-4 rounded-[1.5rem] border shadow-lg",
            "bg-card/60 backdrop-blur-md border-border/60",
            "lg:w-auto lg:inline-grid"
          )}>
            <TabsTrigger 
              value="overview" 
              className={cn(
                "gap-2 rounded-[1rem] transition-all",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className={cn(
                "gap-2 rounded-[1rem] transition-all",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              )}
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
            <TabsTrigger 
              value="achievements" 
              className={cn(
                "gap-2 rounded-[1rem] transition-all",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              )}
            >
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className={cn(
                "gap-2 rounded-[1rem] transition-all",
                "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              )}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {stats && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                {(() => {
                  const totalPoints = profile.totalPoints ?? 0;
                  const level = profile.level ?? 0;
                  const currentReq = profile.levelCurrentPointsRequired ?? pointsForLevel(level);
                  const nextReq = profile.nextLevelPoints ?? (level < 100 ? pointsForLevel(level + 1) : null);
                  const span = profile.levelSpanPoints ?? (nextReq ? Math.max(nextReq - currentReq, 1) : 1);
                  const progress = profile.levelProgressPoints ?? (nextReq ? Math.min(Math.max(totalPoints - currentReq, 0), span) : span);
                  return (
                    <ShowcaseThemeProvider>
                      <ShowcaseProgressTrackerRibbon
                        label={`${profile.tierName || profile.experienceTier || "Rookie"}`}
                        current={progress}
                        goal={span}
                        rightTitle="Level"
                        rightValue={level}
                        milestoneLabel={undefined}
                        footerRight={<Link href="/profile/me/points" className="underline">Points History</Link>}
                      />
                    </ShowcaseThemeProvider>
                  );
                })()}
                <StatsCard
                  title="Current Streak"
                  value={`${stats.stats.currentStreak} days`}
                  subtitle={`Best: ${stats.stats.longestStreak} days`}
                  icon={TrendingUp}
                />
              </div>
            )}

            <div className="grid gap-8 lg:grid-cols-2">
              {stats && (
                <ShowcaseTopicWiseStats
                  title="Top Topics"
                  description="Your best-performing topics"
                  topics={mappedTopTopics}
                  limit={5}
                  viewAllHref="/showcase/topic-wise-stats-complete"
                />
              )}

              <Card className="relative overflow-hidden rounded-[2rem] border shadow-xl bg-card/80 backdrop-blur-lg border-border/60">
                {/* Background blur circles */}
                <div className="absolute -top-20 -right-14 h-56 w-56 rounded-full bg-orange-500/20 blur-[160px]" />
                <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-blue-500/15 blur-[160px]" />
                
                <CardHeader className="relative">
                  <CardTitle className={cn("flex items-center gap-2", glassText.h2)}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-500/30 to-pink-500/30">
                      <Sparkles className="h-4 w-4 text-orange-100" />
                    </div>
                    Profile Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative space-y-4">
                  {profile.bio && (
                    <div>
                      <p className={cn("text-sm", glassText.badge)}>Bio</p>
                      <p className={cn("mt-2", glassText.subtitle)}>{profile.bio}</p>
                    </div>
                  )}
                  {profile.favoriteTeams.length > 0 && (
                    <div>
                      <p className={cn("text-sm", glassText.badge)}>Favorite Teams</p>
                      <p className={cn("mt-2", glassText.subtitle)}>
                        {profile.favoriteTeams.join(", ")}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className={cn("text-sm", glassText.badge)}>Member since</p>
                    <p className={cn("mt-2", glassText.subtitle)}>
                      {new Intl.DateTimeFormat("en-US", {
                        month: "long",
                        year: "numeric",
                      }).format(new Date(profile.createdAt))}
                    </p>
                  </div>
                  <div>
                    <p className={cn("text-sm", glassText.badge)}>Email</p>
                    <p className={cn("mt-2", glassText.subtitle)}>{profile.email}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-8">
            {stats && <ActivityFeed attempts={stats.recentAttempts || []} />}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-8">
            <BadgeShowcase badges={badges} />

            {stats && (
              <Card className="relative overflow-hidden rounded-[2rem] border shadow-xl bg-card/80 backdrop-blur-lg border-border/60">
                {/* Background blur circles */}
                <div className="absolute -top-20 -right-14 h-56 w-56 rounded-full bg-orange-500/20 blur-[160px]" />
                <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-blue-500/15 blur-[160px]" />
                
                <CardHeader className="relative">
                  <CardTitle className={cn("flex items-center gap-2", glassText.h2)}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-500/30 to-pink-500/30">
                      <BarChart3 className="h-4 w-4 text-orange-100" />
                    </div>
                    Performance Summary
                  </CardTitle>
                  <CardDescription className={cn(glassText.subtitle)}>
                    Your overall quiz performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className={cn("text-sm", glassText.badge)}>Total Questions Answered</p>
                      <p className={cn("text-2xl font-bold", glassText.h3)}>
                        {stats.stats.totalAttempts * 10 || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className={cn("text-sm", glassText.badge)}>Accuracy Rate</p>
                      <p className={cn("text-2xl font-bold text-primary", glassText.h3)}>
                        {stats.stats.averageScore.toFixed(1)}%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className={cn("text-sm", glassText.badge)}>Perfect Scores</p>
                      <p className={cn("text-2xl font-bold", glassText.h3)}>
                        {stats.perfectScores || 0}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className={cn("text-sm", glassText.badge)}>Badges Earned</p>
                      <p className={cn("text-2xl font-bold", glassText.h3)}>
                        {badges.filter((b) => b.earned || b.earnedAt).length} / {badges.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-8">
            <Card className="relative overflow-hidden rounded-[2rem] border shadow-xl bg-card/80 backdrop-blur-lg border-border/60">
              {/* Background blur circles */}
              <div className="absolute -top-20 -right-14 h-56 w-56 rounded-full bg-orange-500/20 blur-[160px]" />
              <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-blue-500/15 blur-[160px]" />
              
              <CardHeader className="relative">
                <CardTitle className={cn("flex items-center gap-2", glassText.h2)}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-500/30 to-pink-500/30">
                    <Settings className="h-4 w-4 text-orange-100" />
                  </div>
                  Edit Profile
                </CardTitle>
                <CardDescription className={cn(glassText.subtitle)}>
                  Update your profile information
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className={cn(glassText.badge)}>Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Your name"
                      className="rounded-[1rem] border-border/60 bg-background/60 backdrop-blur-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className={cn(glassText.badge)}>Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      placeholder="Tell us about yourself..."
                      rows={3}
                      className="rounded-[1rem] border-border/60 bg-background/60 backdrop-blur-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="favoriteTeams" className={cn(glassText.badge)}>Favorite Teams</Label>
                    <Input
                      id="favoriteTeams"
                      value={formData.favoriteTeams}
                      onChange={(e) =>
                        setFormData({ ...formData, favoriteTeams: e.target.value })
                      }
                      placeholder="Team 1, Team 2, Team 3"
                      className="rounded-[1rem] border-border/60 bg-background/60 backdrop-blur-sm"
                    />
                    <p className={cn("text-xs", glassText.subtitle)}>
                      Comma-separated list of your favorite teams
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit" 
                      disabled={saving}
                      className="rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_30px_-16px_rgba(249,115,22,0.55)] transition hover:-translate-y-0.5"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden rounded-[2rem] border shadow-xl bg-card/80 backdrop-blur-lg border-border/60">
              {/* Background blur circles */}
              <div className="absolute -top-20 -right-14 h-56 w-56 rounded-full bg-orange-500/20 blur-[160px]" />
              <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-blue-500/15 blur-[160px]" />
              
              <CardHeader className="relative">
                <CardTitle className={cn("flex items-center gap-2", glassText.h2)}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-500/30 to-pink-500/30">
                    <Sparkles className="h-4 w-4 text-orange-100" />
                  </div>
                  Account Information
                </CardTitle>
                <CardDescription className={cn(glassText.subtitle)}>
                  Your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="relative space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className={cn(glassText.badge)}>Email</span>
                  <span className={cn("font-medium", glassText.subtitle)}>{profile.email}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={cn(glassText.badge)}>Role</span>
                  <span className={cn("font-medium", glassText.subtitle)}>{profile.role}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={cn(glassText.badge)}>Experience Tier</span>
                  <span className={cn("font-medium", glassText.subtitle)}>{profile.experienceTier || "ROOKIE"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={cn(glassText.badge)}>Total Points</span>
                  <span className={cn("font-medium", glassText.subtitle)}>
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
