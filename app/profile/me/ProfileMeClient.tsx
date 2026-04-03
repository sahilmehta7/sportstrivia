"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JsonLdScript } from "next-seo";
import { Save, Target, Trophy, TrendingUp } from "lucide-react";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { StatsCard } from "@/components/profile/StatsCard";
import { BadgeShowcase } from "@/components/profile/BadgeShowcase";
import { ActivityFeed } from "@/components/profile/ActivityFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { pointsForLevel } from "@/lib/config/gamification";
import { PushSubscriptionCard } from "@/components/notifications/PushSubscriptionCard";
import { DigestPreferencesCard } from "@/components/notifications/DigestPreferencesCard";
import { DeleteAccountSection } from "@/components/profile/DeleteAccountSection";
import { ProfileDiscoverabilityPanel } from "@/components/profile/ProfileDiscoverabilityPanel";
import { PageContainer } from "@/components/shared/PageContainer";

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

interface TopicTag {
  topicId: string;
  name: string;
  slug: string;
  schemaType: string;
}

interface TopicOption {
  id: string;
  name: string;
  slug: string;
  schemaType: string;
  entityStatus?: string;
  level?: number;
  parentId?: string | null;
}

type FollowableSchemaType =
  | "SPORT"
  | "SPORTS_TEAM"
  | "ATHLETE"
  | "SPORTS_EVENT"
  | "SPORTS_ORGANIZATION";

const FOLLOWABLE_SCHEMA_TYPES = new Set<FollowableSchemaType>([
  "SPORT",
  "SPORTS_TEAM",
  "ATHLETE",
  "SPORTS_EVENT",
  "SPORTS_ORGANIZATION",
]);

function isEligibleInterestTopic(topic: TopicOption): boolean {
  return (
    FOLLOWABLE_SCHEMA_TYPES.has(topic.schemaType as FollowableSchemaType) &&
    topic.entityStatus === "READY"
  );
}

interface ProfileMeClientProps {
  profile: ProfileData;
  stats: ProfileStats | null;
  badges: BadgeProgress[];
  interests: TopicTag[];
  followedTopics: TopicTag[];
}

export function ProfileMeClient({
  profile: initialProfile,
  stats,
  badges,
  interests,
  followedTopics,
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
  const [interestEditOpen, setInterestEditOpen] = useState(false);
  const [interestSaving, setInterestSaving] = useState(false);
  const [interestSearch, setInterestSearch] = useState("");
  const [interestOptions, setInterestOptions] = useState<TopicOption[]>([]);
  const [interestDraft, setInterestDraft] = useState<TopicTag[]>(interests);
  const [interestPreferences, setInterestPreferences] = useState<{
    preferredDifficulty: "EASY" | "MEDIUM" | "HARD" | null;
    preferredPlayModes: string[];
  }>({
    preferredDifficulty: null,
    preferredPlayModes: [],
  });

  useEffect(() => {
    setProfile(initialProfile);
    setFormData({
      name: initialProfile.name ?? "",
      bio: initialProfile.bio ?? "",
      favoriteTeams: initialProfile.favoriteTeams.join(", "),
    });
  }, [initialProfile]);

  useEffect(() => {
    setInterestDraft(interests);
  }, [interests]);

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
              .map((t) => t.trim())
              .filter(Boolean)
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
        setFormData({
          name: u.name ?? "",
          bio: u.bio ?? "",
          favoriteTeams: (u.favoriteTeams ?? []).join(", "),
        });
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

  const xpSnapshot = useMemo(() => {
    const totalPoints = profile.totalPoints ?? 0;
    const level = profile.level ?? 0;
    const currentReq = profile.levelCurrentPointsRequired ?? pointsForLevel(level);
    const nextReq = profile.nextLevelPoints ?? (level < 100 ? pointsForLevel(level + 1) : null);
    const span = profile.levelSpanPoints ?? (nextReq ? Math.max(nextReq - currentReq, 1) : 1);
    const progressPoints = profile.levelProgressPoints ?? (nextReq ? Math.min(Math.max(totalPoints - currentReq, 0), span) : span);
    const progressPercent = Math.min(100, Math.max(0, Math.round((progressPoints / Math.max(span, 1)) * 100)));
    const pointsToNext = nextReq ? Math.max(nextReq - totalPoints, 0) : 0;

    return {
      totalPoints,
      level,
      span,
      progressPoints,
      progressPercent,
      pointsToNext,
      nextReq,
      tierName: profile.tierName || profile.experienceTier || "ROOKIE",
    };
  }, [profile]);

  const filteredInterestOptions = useMemo(() => {
    const selectedIds = new Set(interestDraft.map((item) => item.topicId));
    const q = interestSearch.trim().toLowerCase();
    const unselected = interestOptions.filter((topic) => !selectedIds.has(topic.id));

    // First-time suggestions: only Level 1 SPORTS topics.
    if (interestDraft.length === 0) {
      return unselected
        .filter((topic) => topic.schemaType === "SPORT" && topic.level === 1)
        .filter((topic) => {
          if (!q) return true;
          return topic.name.toLowerCase().includes(q) || topic.slug.toLowerCase().includes(q);
        })
        .slice(0, 10);
    }

    // Graph-based related suggestions after initial interests are set.
    const optionsById = new Map(interestOptions.map((topic) => [topic.id, topic]));
    const selectedParentIds = new Set(
      interestDraft
        .map((item) => optionsById.get(item.topicId)?.parentId)
        .filter((parentId): parentId is string => Boolean(parentId))
    );

    const related = unselected.filter((topic) => {
      const isParent = selectedParentIds.has(topic.id);
      const isChild = Boolean(topic.parentId && selectedIds.has(topic.parentId));
      const isSibling = Boolean(topic.parentId && selectedParentIds.has(topic.parentId));
      return isParent || isChild || isSibling;
    });

    const pool = related.length > 0 ? related : unselected;
    return pool
      .filter((topic) => {
        if (!q) return true;
        return topic.name.toLowerCase().includes(q) || topic.slug.toLowerCase().includes(q);
      })
      .slice(0, 10);
  }, [interestDraft, interestOptions, interestSearch]);

  const openInterestsEditor = async () => {
    try {
      const [topicsRes, interestsRes] = await Promise.all([
        fetch("/api/topics?limit=300"),
        fetch("/api/users/me/interests"),
      ]);
      const [topicsPayload, interestsPayload] = await Promise.all([topicsRes.json(), interestsRes.json()]);
      if (!topicsRes.ok || !interestsRes.ok) {
        throw new Error("Failed to load interest editor data");
      }
      const eligibleTopics = ((topicsPayload?.data?.topics ?? []) as TopicOption[]).filter(
        isEligibleInterestTopic
      );
      setInterestOptions(eligibleTopics);
      const prefs = interestsPayload?.data?.preferences;
      setInterestPreferences({
        preferredDifficulty: prefs?.preferredDifficulty ?? null,
        preferredPlayModes: prefs?.preferredPlayModes ?? [],
      });
      setInterestEditOpen(true);
    } catch (error: any) {
      toast({
        title: "Unable to open editor",
        description: error.message || "Could not load topics",
        variant: "destructive",
      });
    }
  };

  const saveInterests = async () => {
    setInterestSaving(true);
    try {
      const response = await fetch("/api/users/me/interests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicIds: interestDraft.map((item) => item.topicId),
          source: "PROFILE",
          preferences: {
            preferredDifficulty: interestPreferences.preferredDifficulty,
            preferredPlayModes: interestPreferences.preferredPlayModes,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save interests");
      }
      toast({ title: "Saved", description: "Interests updated successfully." });
      setInterestEditOpen(false);
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Could not update interests",
        variant: "destructive",
      });
    } finally {
      setInterestSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-background py-6 sm:py-8">
      <PageContainer className="space-y-6">
        <ProfileHeader user={profile as any} isOwnProfile showEditButton={false} compact flat />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid h-auto grid-cols-4 gap-1 rounded-none border border-border bg-card p-1">
            {[
              { value: "overview", label: "Overview" },
              { value: "activity", label: "History" },
              { value: "achievements", label: "Badges" },
              { value: "settings", label: "Settings" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none px-2 py-2 text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 4)}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {stats && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <StatsCard
                  title="Records"
                  value={stats.stats.totalAttempts}
                  variant="cyan"
                  icon={Trophy}
                  subtitle={`${stats.stats.passedQuizzes} SUCCESS`}
                  flat
                  compact
                />
                <StatsCard
                  title="Accuracy"
                  value={`${stats.stats.averageScore.toFixed(0)}%`}
                  variant="magenta"
                  icon={Target}
                  subtitle={`${stats.stats.passRate.toFixed(0)}% RATE`}
                  flat
                  compact
                />
                <StatsCard
                  title="Streak"
                  value={`${stats.stats.currentStreak}D`}
                  variant="lime"
                  icon={TrendingUp}
                  subtitle={`BEST ${stats.stats.longestStreak}D`}
                  className="col-span-2 md:col-span-1"
                  flat
                  compact
                />
              </div>
            )}

            <section className="border border-border bg-card p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Tier</p>
                  <p className="text-2xl font-black uppercase tracking-tight">{xpSnapshot.tierName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Level</p>
                  <p className="text-3xl font-black">{xpSnapshot.level}</p>
                </div>
              </div>

              <div className="grid gap-2 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total XP</p>
                  <p className="text-lg font-bold">{xpSnapshot.totalPoints.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Current Level</p>
                  <p className="text-lg font-bold">{xpSnapshot.progressPoints.toLocaleString()} / {xpSnapshot.span.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">To Next Level</p>
                  <p className="text-lg font-bold">{xpSnapshot.nextReq ? xpSnapshot.pointsToNext.toLocaleString() : "MAX"}</p>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                <Progress value={xpSnapshot.progressPercent} className="h-2 rounded-none" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{xpSnapshot.progressPercent}% complete</span>
                  <Link href="/profile/me/points" className="font-semibold uppercase tracking-wide text-primary hover:underline">
                    Points History
                  </Link>
                </div>
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold uppercase tracking-wide">Topic Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stats && stats.topTopics.length > 0 ? (
                    stats.topTopics.slice(0, 6).map((item) => (
                      <Link
                        key={item.id}
                        href={`/topics/${item.topic.slug}`}
                        className="flex items-center justify-between border border-border px-3 py-2 text-sm hover:bg-muted/40"
                      >
                        <span className="truncate font-medium">{item.topic.name}</span>
                        <span className="ml-3 shrink-0 font-semibold text-primary">{Math.round(item.successRate)}%</span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No topic stats yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-none">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-bold uppercase tracking-wide">User Interests & Followed Topics</CardTitle>
                    {interestEditOpen ? (
                      <Button variant="outline" size="sm" className="rounded-none" onClick={() => setInterestEditOpen(false)}>
                        Cancel
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="rounded-none" onClick={openInterestsEditor}>
                        Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Interests</p>
                    <TopicTagList
                      items={interestDraft}
                      emptyLabel="No explicit interests yet"
                    />
                  </div>

                  {interestEditOpen && (
                    <div className="space-y-3 border border-border p-3">
                      <Input
                        value={interestSearch}
                        onChange={(e) => setInterestSearch(e.target.value)}
                        placeholder="Search topics to add"
                        className="rounded-none h-10"
                      />
                      <div className="grid gap-2">
                        {filteredInterestOptions.map((topic) => (
                          <button
                            key={topic.id}
                            type="button"
                            className="flex items-center justify-between border border-border px-3 py-2 text-left text-sm hover:bg-muted/40"
                            onClick={() =>
                              setInterestDraft((current) => [
                                ...current,
                                {
                                  topicId: topic.id,
                                  name: topic.name,
                                  slug: topic.slug,
                                  schemaType: topic.schemaType,
                                },
                              ])
                            }
                          >
                            <span className="truncate font-medium">{topic.name}</span>
                            <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                              {topic.schemaType.replace("SPORTS_", "")}
                            </span>
                          </button>
                        ))}
                        {filteredInterestOptions.length === 0 && (
                          <p className="text-xs text-muted-foreground">No matching topics.</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Selected Interests</p>
                        <div className="flex flex-wrap gap-2">
                          {interestDraft.map((item) => (
                            <button
                              key={`edit-${item.topicId}`}
                              type="button"
                              className="border border-primary/40 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                              onClick={() =>
                                setInterestDraft((current) =>
                                  current.filter((entry) => entry.topicId !== item.topicId)
                                )
                              }
                            >
                              {item.name} ×
                            </button>
                          ))}
                        </div>
                      </div>

                      <Button
                        type="button"
                        onClick={saveInterests}
                        disabled={interestSaving}
                        className="rounded-none"
                      >
                        {interestSaving ? "Saving..." : "Save Interests"}
                      </Button>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Followed Topics</p>
                    <TopicTagList
                      items={followedTopics}
                      emptyLabel="No followed topics yet"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            {stats && <ActivityFeed attempts={stats.recentAttempts || []} />}
          </TabsContent>

          <TabsContent value="achievements">
            <BadgeShowcase badges={badges as any} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 shrink-0">
            <ProfileDiscoverabilityPanel />

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <h4 className="text-base font-black uppercase tracking-wide">System Access</h4>
                <div className="space-y-4">
                  <PushSubscriptionCard />
                  <DigestPreferencesCard />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-black uppercase tracking-wide">Profile Config</h4>
                  {!editOpen && (
                    <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="rounded-none">
                      Configure
                    </Button>
                  )}
                </div>

                {editOpen ? (
                  <Card className="rounded-none border-primary/30">
                    <CardContent className="pt-6">
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identifier</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-none h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Affiliated Teams</Label>
                            <Input value={formData.favoriteTeams} onChange={(e) => setFormData({ ...formData, favoriteTeams: e.target.value })} className="rounded-none h-11" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Biographical Data</Label>
                          <Textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} rows={4} className="rounded-none" />
                        </div>
                        <div className="flex gap-3">
                          <Button type="submit" size="lg" disabled={saving} className="flex-1 rounded-none">
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? "Uploading..." : "Sync Profile"}
                          </Button>
                          <Button type="button" variant="outline" size="lg" onClick={() => setEditOpen(false)} className="rounded-none">Abort</Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="rounded-none">
                    <CardContent className="space-y-6 pt-6">
                      <div className="grid gap-6 sm:grid-cols-2">
                        <InfoItem label="EMAIL" value={profile.email} />
                        <InfoItem label="ROLE" value={profile.role} />
                        <InfoItem label="JOINED" value={new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(new Date(profile.createdAt))} />
                        <InfoItem label="STATUS" value="ONLINE" color="text-emerald-500" />
                      </div>
                      {profile.bio && <InfoItem label="BIO" value={profile.bio} fullWidth />}
                      {profile.favoriteTeams.length > 0 && <InfoItem label="TEAMS" value={profile.favoriteTeams.join(", ")} fullWidth />}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <DeleteAccountSection />
          </TabsContent>
        </Tabs>
      </PageContainer>

      <JsonLdScript
        scriptKey="person-jsonld"
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          name: profile.name || "UNREGISTERED",
          image: profile.image,
          description: profile.bio,
        }}
      />
    </main>
  );
}

function TopicTagList({ items, emptyLabel }: { items: TopicTag[]; emptyLabel: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.slice(0, 16).map((item) => (
        <Link
          key={`${item.topicId}-${item.slug}`}
          href={`/topics/${item.slug}`}
          className="border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted/40"
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}

function InfoItem({ label, value, color, fullWidth }: { label: string; value: string; color?: string; fullWidth?: boolean }) {
  return (
    <div className={cn("space-y-1.5", fullWidth && "sm:col-span-2")}>
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{label}</p>
      <p className={cn("text-sm font-bold tracking-tight", color || "text-foreground")}>{value}</p>
    </div>
  );
}
