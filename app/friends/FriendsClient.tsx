"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FriendsList } from "@/components/friends/FriendsList";
import { FriendRequests } from "@/components/friends/FriendRequests";
import { AddFriendForm } from "@/components/friends/AddFriendForm";
import { ChallengesList } from "@/components/features/social/ChallengesList";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, Inbox, UserPlus, Swords, Activity, Zap, ShieldCheck } from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { getBlurCircles, getGradientText } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";

interface FriendSummary {
  id: string;
  friend: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    currentStreak: number;
    longestStreak: number;
  };
}

interface FriendRequestSummary {
  id: string;
  user: { id: string; name: string | null; email: string; image: string | null };
  friend: { id: string; name: string | null; email: string; image: string | null };
  createdAt: string;
}

interface Challenge {
  id: string;
  challengerId: string;
  quizId: string;
  challengerScore: number | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED";
  createdAt: Date;
  challenger: { id: string; name: string | null; image: string | null };
  quiz: { id: string; title: string; slug: string; difficulty: "EASY" | "MEDIUM" | "HARD"; sport: string | null };
}

interface FriendsClientProps {
  friends: FriendSummary[];
  receivedRequests: FriendRequestSummary[];
  sentRequests: FriendRequestSummary[];
  challenges: Challenge[];
}

export function FriendsClient({
  friends,
  receivedRequests,
  sentRequests,
  challenges,
}: FriendsClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const filteredFriends = useMemo(() => {
    if (!search) return friends;
    const searchLower = search.toLowerCase();
    return friends.filter(
      (f) => f.friend.name?.toLowerCase().includes(searchLower) || f.friend.email.toLowerCase().includes(searchLower)
    );
  }, [friends, search]);

  const refresh = () => router.refresh();

  const handleAccept = async (requestId: string) => {
    try {
      const res = await fetch(`/api/friends/${requestId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "accept" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to accept request");
      toast({ title: "Success", description: "Friend request accepted" });
      refresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      const res = await fetch(`/api/friends/${requestId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "decline" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to decline request");
      toast({ title: "Success", description: "Friend request declined" });
      refresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleRemove = async (friendshipId: string) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to remove friend");
      toast({ title: "Success", description: "Friend removed successfully" });
      refresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      const res = await fetch(`/api/friends/${requestId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to cancel request");
      toast({ title: "Success", description: "Friend request cancelled" });
      refresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <ShowcaseThemeProvider>
      <main className="relative min-h-screen overflow-hidden pt-12 pb-24 lg:pt-20">
        <div className="absolute inset-0 -z-10">{getBlurCircles()}</div>

        <PageContainer className="space-y-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 pt-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-1 rounded-full bg-primary shadow-neon-cyan" />
                <h1 className={cn("text-5xl lg:text-7xl font-black uppercase tracking-tighter", getGradientText("neon"))}>
                  NETWORK
                </h1>
              </div>
              <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase lg:pl-5">
                TACTICAL CONCENTRIC • SOCIAL SYNC INTERFACE
              </p>
            </div>
          </div>

          <Tabs defaultValue="friends" className="space-y-12">
            <div className="flex justify-center">
              <TabsList className="h-auto p-1.5 rounded-[2rem] glass border border-white/10 shadow-glass-lg">
                {[
                  { value: "friends", label: "Nodes", count: friends.length, icon: Users },
                  { value: "challenges", label: "Arenas", count: challenges.length, icon: Swords, isOrange: true },
                  { value: "requests", label: "Signals", count: receivedRequests.length, icon: Inbox },
                  { value: "add", label: "Recruit", icon: UserPlus },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-[1.75rem] px-6 lg:px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon-cyan/40 relative"
                  >
                    <tab.icon className="h-3.5 w-3.5 mr-2" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={cn(
                        "absolute -top-1 -right-1 h-5 w-5 rounded-full text-white text-[8px] flex items-center justify-center border-2 border-background shadow-lg",
                        tab.isOrange ? "bg-secondary shadow-neon-magenta-sm" : "bg-primary-foreground/20"
                      )}>
                        {tab.count}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="friends" className="space-y-10">
              <div className="max-w-xl mx-auto">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="OPERATOR IDENTIFIER..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-14 pl-12 rounded-2xl glass border-white/10 text-sm font-bold tracking-widest uppercase placeholder:text-white/10 focus:border-primary/40 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <FriendsList friends={filteredFriends} onRemove={handleRemove} />
            </TabsContent>

            <TabsContent value="challenges">
              <div className="max-w-3xl mx-auto">
                <ChallengesList challenges={challenges as any} />
              </div>
            </TabsContent>

            <TabsContent value="requests" className="max-w-3xl mx-auto">
              <FriendRequests
                received={receivedRequests as any}
                sent={sentRequests as any}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onCancel={handleCancel}
              />
            </TabsContent>

            <TabsContent value="add" className="max-w-3xl mx-auto">
              <AddFriendForm onSuccess={refresh} />
            </TabsContent>
          </Tabs>
        </PageContainer>

        {/* Tactical UI Decors */}
        <div className="absolute top-1/4 -left-20 pointer-events-none opacity-5">
          <Zap className="h-[500px] w-[500px] text-primary rotate-12" />
        </div>
      </main>
    </ShowcaseThemeProvider>
  );
}
