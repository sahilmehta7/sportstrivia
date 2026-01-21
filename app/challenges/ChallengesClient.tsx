"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { ChallengeResultsModal } from "@/components/challenges/ChallengeResultsModal";
import { CreateChallengeModal } from "@/components/challenges/CreateChallengeModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/hooks/use-toast";
import {
  Swords,
  Inbox,
  Send,
  Plus,
  Zap,
  LayoutDashboard,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { getBlurCircles, getGradientText } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";

interface ChallengeListItem {
  id: string;
  quizId: string;
  quiz: { title: string; slug: string; difficulty: string };
  challenger: { id: string; name: string | null; image: string | null };
  challenged: { id: string; name: string | null; image: string | null };
  challengerScore: number | null;
  challengedScore: number | null;
  status: string;
  createdAt: string;
  expiresAt: string | null;
}

interface ChallengesClientProps {
  currentUserId: string;
  activeChallenges: ChallengeListItem[];
  receivedChallenges: ChallengeListItem[];
  sentChallenges: ChallengeListItem[];
}

export function ChallengesClient({
  currentUserId,
  activeChallenges,
  receivedChallenges,
  sentChallenges,
}: ChallengesClientProps) {
  const { toast } = useToast();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"active" | "received" | "sent">("active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<{
    id: string;
    quiz: { title: string; slug: string };
    challenger: { id: string; name: string | null; image: string | null };
    challenged: { id: string; name: string | null; image: string | null };
    challengerScore: number;
    challengedScore: number;
  } | null>(null);

  const refreshChallenges = () => router.refresh();

  const handleAccept = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/accept`, { method: "PATCH" });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to accept challenge");
      toast({ title: "Success", description: "Challenge accepted! Take the quiz to compete." });
      refreshChallenges();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDecline = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/decline`, { method: "PATCH" });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to decline challenge");
      toast({ title: "Success", description: "Challenge declined" });
      refreshChallenges();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleCancel = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await response.json()).error || "Failed to cancel challenge");
      toast({ title: "Success", description: "Challenge cancelled" });
      refreshChallenges();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleViewResults = (challenge: ChallengeListItem) => {
    if (challenge.challengerScore === null || challenge.challengedScore === null) return;
    setSelectedChallenge({
      id: challenge.id, quiz: { title: challenge.quiz.title, slug: challenge.quiz.slug },
      challenger: challenge.challenger, challenged: challenge.challenged,
      challengerScore: challenge.challengerScore, challengedScore: challenge.challengedScore,
    });
  };

  const renderChallengesList = (challenges: ChallengeListItem[], icon: LucideIcon, title: string, desc: string, isReceived: boolean = false, isSent: boolean = false) => {
    if (challenges.length === 0) {
      return (
        <div className="py-24 text-center space-y-6 rounded-[3rem] glass border border-dashed border-white/10">
          <div className="h-16 w-16 mx-auto rounded-full glass border border-white/5 flex items-center justify-center text-muted-foreground/20">
            {icon({ className: "h-8 w-8" } as any)}
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">{title}</p>
            <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-widest">{desc}</p>
          </div>
        </div>
      );
    }
    return (
      <div className="grid gap-8">
        {challenges.map((c) => (
          <ChallengeCard key={c.id} challenge={c} currentUserId={currentUserId}
            onAccept={isReceived ? () => handleAccept(c.id) : undefined}
            onDecline={isReceived ? () => handleDecline(c.id) : (isSent ? () => handleCancel(c.id) : undefined)}
            onViewResults={() => handleViewResults(c)}
          />
        ))}
      </div>
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden pt-12 pb-24 lg:pt-20">
      <div className="absolute inset-0 -z-10">{getBlurCircles()}</div>

      <PageContainer className="space-y-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 pt-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-1 rounded-full bg-primary shadow-neon-cyan" />
              <h1 className={cn("text-5xl lg:text-7xl font-black uppercase tracking-tighter", getGradientText("neon"))}>
                CHALLENGES
              </h1>
            </div>
            <p className="text-sm font-bold tracking-widest text-muted-foreground uppercase lg:pl-5">
              COMBAT ZONE • DIRECT COMPETITION INTERFACE
            </p>
          </div>
          <Button variant="neon" size="lg" onClick={() => setShowCreateModal(true)} className="rounded-full px-10">
            <Plus className="mr-3 h-5 w-5" />
            INITIATE CHALLENGE
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-12">
          <div className="flex justify-center">
            <TabsList className="h-auto p-1.5 rounded-[2rem] glass border border-white/10 shadow-glass-lg">
              {[
                { value: "active", label: "Active", count: activeChallenges.length, icon: Swords },
                { value: "received", label: "Pending", count: receivedChallenges.length, icon: Inbox },
                { value: "sent", label: "Dispatched", count: sentChallenges.length, icon: Send },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-[1.75rem] px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-neon-cyan/40 relative"
                >
                  <tab.icon className="h-3.5 w-3.5 mr-2" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-secondary text-white text-[8px] flex items-center justify-center border-2 border-background shadow-neon-magenta-sm">
                      {tab.count}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="active">
            {renderChallengesList(activeChallenges, Swords, "NO ACTIVE COMBAT", "ENGAGE TARGETS OR INITIATE NEW MISSION")}
          </TabsContent>
          <TabsContent value="received">
            {renderChallengesList(receivedChallenges, Inbox, "NO INBOUND SIGNALS", "AWAITING EXTERNAL TRANSMISSIONS", true)}
          </TabsContent>
          <TabsContent value="sent">
            {renderChallengesList(sentChallenges, Send, "NO OUTBOUND DISPATCHES", "TRANSMIT CHALLENGES TO TARGETS", false, true)}
          </TabsContent>
        </Tabs>
      </PageContainer>

      <CreateChallengeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => { setShowCreateModal(false); refreshChallenges(); }}
      />

      {selectedChallenge && (
        <ChallengeResultsModal
          isOpen={true}
          onClose={() => setSelectedChallenge(null)}
          challenge={selectedChallenge}
          currentUserId={currentUserId}
        />
      )}
    </main>
  );
}
