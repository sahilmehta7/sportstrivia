"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsCard } from "@/components/profile/StatsCard";
import { BadgeShowcase } from "@/components/profile/BadgeShowcase";
import { ActivityFeed } from "@/components/profile/ActivityFeed";
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
  TrendingUp,
  BarChart3,
  Save,
  Activity,
  LayoutDashboard,
  Settings,
  Award,
  Sparkles,
  Zap,
  Target,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ShowcaseTopicWiseStats, ShowcaseContinuePlayingQueue } from "@/showcase/components";
import { ShowcaseProgressTrackerRibbon } from "@/components/showcase/ui/ProgressTrackerRibbon";
import { pointsForLevel } from "@/lib/config/gamification";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import Link from "next/link";
import { PushSubscriptionCard } from "@/components/notifications/PushSubscriptionCard";
import { DigestPreferencesCard } from "@/components/notifications/DigestPreferencesCard";
import { JsonLdScript } from "next-seo";
import { PageContainer } from "@/components/shared/PageContainer";
import { getBlurCircles, getGradientText } from "@/lib/showcase-theme";

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
}

export function ProfileMeClient({
  profile: initialProfile,
  stats,
  badges,
}: ProfileMeClientProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState(initialProfile);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
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
          ? formData.favoriteTeams.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to update profile");
      if (result.data?.user) {
        const u = result.data.user;
        setProfile({ ...profile, ...u, favoriteTeams: u.favoriteTeams ?? [] });
        setFormData({ name: u.name ?? "", bio: u.bio ?? "", favoriteTeams: (u.favoriteTeams ?? []).join(", ") });
      }
      toast({ title: "Success", description: "Profile updated successfully" });
      setEditOpen(false);
      router.refresh();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

  const continueItems = (() => {
    const attempts = (stats?.recentAttempts ?? []).filter(
      (a) => a.quiz && (a.quiz as any).recurringType && (a.quiz as any).recurringType !== "NONE" && a.completedAt
    );
    const map = new Map<string, any>();
    for (const a of attempts) {
      const dayTs = new Date(a.completedAt as any).setHours(0, 0, 0, 0);
      const ts = new Date(a.completedAt as any).getTime();
      const entry = map.get(a.quiz.slug) ?? { id: a.quiz.slug, title: a.quiz.title, slug: a.quiz.slug, dates: [], lastCompletedAt: 0 };
      entry.dates.push(dayTs);
      entry.lastCompletedAt = Math.max(entry.lastCompletedAt, ts);
      map.set(a.quiz.slug, entry);
    }
    const last7 = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0); return d.getTime();
    });
    return Array.from(map.values())
      .sort((a, b) => b.lastCompletedAt - a.lastCompletedAt)
      .slice(0, 5)
      .map((g) => {
        const uniqueDaysDesc = Array.from(new Set(g.dates)).sort((a: any, b: any) => b - a);
        const daysOfWeek = last7.map((t) => (uniqueDaysDesc as any).includes(t));
        let streak = 0; if (uniqueDaysDesc.length > 0) { streak = 1; for (let i = 1; i < uniqueDaysDesc.length; i++) { if ((uniqueDaysDesc[i - 1] as any) - (uniqueDaysDesc[i] as any) === 86400000) streak += 1; else break; } }
        return {
          id: g.id, title: g.title, progress: 0,
          lastPlayedLabel: new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(g.lastCompletedAt)),
          slug: g.slug, daysOfWeek, streak,
        };
      });
  })();

  return (
    <ShowcaseThemeProvider>
      <main className="relative min-h-screen overflow-hidden pt-12 pb-24 lg:pt-20">
        <div className="absolute inset-0 -z-10">{getBlurCircles()}</div>

        <PageContainer className="space-y-16">
          <ProfileHeader user={profile as any} isOwnProfile showEditButton={false} />

          <Tabs defaultValue="overview" className="space-y-12">
            <div className="flex justify-center">
              <TabsList className="h-auto p-1.5 rounded-[2rem] glass border border-white/10 shadow-glass-lg">
                {[
                  { value: "overview", label: "Overview", icon: LayoutDashboard },
                  { value: "activity", label: "Chronicle", icon: Activity },
                  { value: "achievements", label: "Matrix", icon: Award },
                  { value: "settings", label: "Settings", icon: Settings },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-[1.75rem] px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon-cyan/40"
                  >
                    <tab.icon className="h-3.5 w-3.5 mr-2" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-16">
              {stats && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <StatsCard title="RECORDS" value={stats.stats.totalAttempts} variant="cyan" icon={Trophy} subtitle={`${stats.stats.passedQuizzes} MISSIONS SUCCESS`} />
                  <StatsCard title="ACCURACY" value={`${stats.stats.averageScore.toFixed(0)}%`} variant="magenta" icon={Target} subtitle={`${stats.stats.passRate.toFixed(0)}% RATE`} />
                  <StatsCard title="STREAK" value={`${stats.stats.currentStreak} DAYS`} variant="lime" icon={TrendingUp} subtitle={`BEST: ${stats.stats.longestStreak} D`} />
                  {(() => {
                    const totalPoints = profile.totalPoints ?? 0;
                    const level = profile.level ?? 0;
                    const currentReq = profile.levelCurrentPointsRequired ?? pointsForLevel(level);
                    const nextReq = profile.nextLevelPoints ?? (level < 100 ? pointsForLevel(level + 1) : null);
                    const span = profile.levelSpanPoints ?? (nextReq ? Math.max(nextReq - currentReq, 1) : 1);
                    const progress = profile.levelProgressPoints ?? (nextReq ? Math.min(Math.max(totalPoints - currentReq, 0), span) : span);
                    return (
                      <div className="flex flex-col gap-1 p-6 rounded-[2rem] glass-elevated border border-white/5 shadow-neon-cyan/5">
                        <div className="flex items-center justify-between mb-4">
                          <Zap className="h-5 w-5 text-primary" />
                          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">TIER {level}</div>
                        </div>
                        <ShowcaseProgressTrackerRibbon
                          label={`${profile.tierName || profile.experienceTier || "ROOKIE"}`}
                          current={progress}
                          goal={span}
                          rightTitle="XP"
                          rightValue={totalPoints.toLocaleString()}
                          milestoneLabel={undefined}
                          footerRight={<Link href="/profile/me/points" className="text-[10px] font-black text-primary hover:underline">HISTORY →</Link>}
                        />
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="grid gap-12 lg:grid-cols-2">
                {stats && mappedTopTopics.length > 0 && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 px-2">
                      <div className="h-6 w-1 rounded-full bg-primary shadow-neon-cyan" />
                      <h4 className="text-2xl font-black uppercase tracking-tight">Sector Insights</h4>
                    </div>
                    <ShowcaseTopicWiseStats
                      title=""
                      description=""
                      topics={mappedTopTopics}
                      limit={5}
                      className="bg-transparent border-0 p-0 shadow-none"
                    />
                  </div>
                )}
                {continueItems.length > 0 && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 px-2">
                      <div className="h-6 w-1 rounded-full bg-secondary shadow-neon-magenta" />
                      <h4 className="text-2xl font-black uppercase tracking-tight">Active Arenas</h4>
                    </div>
                    <div className="rounded-[2.5rem] p-8 glass-elevated border border-white/10">
                      <ShowcaseContinuePlayingQueue
                        embedded
                        items={continueItems}
                        onResume={(item: any) => router.push(`/quizzes/${item.slug}`)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity">
              {stats && <ActivityFeed attempts={stats.recentAttempts || []} />}
            </TabsContent>

            <TabsContent value="achievements">
              <BadgeShowcase badges={badges as any} />
            </TabsContent>

            <TabsContent value="settings" className="space-y-12 shrink-0">
              <div className="grid gap-12 lg:grid-cols-2">
                <div className="space-y-8">
                  <div className="flex items-center gap-4 px-2">
                    <div className="h-6 w-1 rounded-full bg-primary shadow-neon-cyan" />
                    <h4 className="text-2xl font-black uppercase tracking-tight">System Access</h4>
                  </div>
                  <div className="space-y-6">
                    <PushSubscriptionCard />
                    <DigestPreferencesCard />
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4 px-2 flex-row justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-6 w-1 rounded-full bg-secondary shadow-neon-magenta" />
                      <h4 className="text-2xl font-black uppercase tracking-tight">Profile Config</h4>
                    </div>
                    {!editOpen && (
                      <Button variant="glass" size="sm" onClick={() => setEditOpen(true)} className="rounded-2xl">CONFIGURE</Button>
                    )}
                  </div>

                  {editOpen ? (
                    <div className="rounded-[2.5rem] p-8 glass-elevated border border-primary/20 shadow-neon-cyan/5">
                      <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">IDENTIFIER</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-2xl glass h-12" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">AFFILIATED TEAMS</Label>
                            <Input value={formData.favoriteTeams} onChange={(e) => setFormData({ ...formData, favoriteTeams: e.target.value })} className="rounded-2xl glass h-12" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">BIOGRAPHICAL DATA</Label>
                          <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={4} className="rounded-2xl glass" />
                        </div>
                        <div className="flex gap-4">
                          <Button type="submit" variant="neon" size="lg" disabled={saving} className="flex-1">
                            <Save className="mr-3 h-4 w-4" />
                            {saving ? "UPLOADING..." : "SYNC PROFILE"}
                          </Button>
                          <Button type="button" variant="glass" size="lg" onClick={() => setEditOpen(false)}>ABORT</Button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="rounded-[2.5rem] p-8 glass-elevated border border-white/10 space-y-8">
                      <div className="grid gap-8 sm:grid-cols-2">
                        <InfoItem label="EMAIL" value={profile.email} />
                        <InfoItem label="ROLE" value={profile.role} />
                        <InfoItem label="JOINED" value={new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(profile.createdAt))} />
                        <InfoItem label="STATUS" value="ONLINE - SECURE" color="text-emerald-400" />
                      </div>
                      {profile.bio && <InfoItem label="BIO" value={profile.bio} fullWidth />}
                      {profile.favoriteTeams.length > 0 && <InfoItem label="TEAMS" value={profile.favoriteTeams.join(", ")} fullWidth />}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </PageContainer>

        <JsonLdScript scriptKey="person-jsonld" data={{ "@context": "https://schema.org", "@type": "Person", name: profile.name || "UNREGISTERED", image: profile.image, description: profile.bio }} />
      </main>
    </ShowcaseThemeProvider>
  );
}

function InfoItem({ label, value, color, fullWidth }: { label: string, value: string, color?: string, fullWidth?: boolean }) {
  return (
    <div className={cn("space-y-1.5", fullWidth && "sm:col-span-2")}>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
      <p className={cn("text-sm font-bold tracking-tight", color || "text-foreground")}>{value}</p>
    </div>
  );
}
