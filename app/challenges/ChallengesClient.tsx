"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
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
  type LucideIcon,
} from "lucide-react";

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

  const refreshChallenges = () => {
    router.refresh();
  };

  const handleAccept = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/accept`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to accept challenge");
      }

      toast({
        title: "Success",
        description: "Challenge accepted! Take the quiz to compete.",
      });

      refreshChallenges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}/decline`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to decline challenge");
      }

      toast({
        title: "Success",
        description: "Challenge declined",
      });

      refreshChallenges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to cancel challenge");
      }

      toast({
        title: "Success",
        description: "Challenge cancelled",
      });

      refreshChallenges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewResults = (challenge: ChallengeListItem) => {
    if (
      challenge.challengerScore === null ||
      challenge.challengedScore === null
    ) {
      return;
    }

    setSelectedChallenge({
      id: challenge.id,
      quiz: {
        title: challenge.quiz.title,
        slug: challenge.quiz.slug,
      },
      challenger: challenge.challenger,
      challenged: challenge.challenged,
      challengerScore: challenge.challengerScore,
      challengedScore: challenge.challengedScore,
    });
  };

  const renderChallenges = (
    challenges: ChallengeListItem[],
    emptyIcon: LucideIcon,
    emptyTitle: string,
    emptyDescription: string,
    actions: (challenge: ChallengeListItem) => {
      onAccept?: () => void;
      onDecline?: () => void;
      onViewResults?: () => void;
    }
  ) => {
    if (challenges.length === 0) {
      return (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
        />
      );
    }

    return challenges.map((challenge) => (
      <ChallengeCard
        key={challenge.id}
        challenge={challenge}
        currentUserId={currentUserId}
        {...actions(challenge)}
      />
    ));
  };

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Challenges"
            description="Compete with your friends on quizzes"
          />
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Challenge
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Swords className="h-4 w-4" />
              Active
              {activeChallenges.length > 0 && (
                <Badge variant="secondary">{activeChallenges.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Received
              {receivedChallenges.length > 0 && (
                <Badge variant="default">{receivedChallenges.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Sent
              {sentChallenges.length > 0 && (
                <Badge variant="secondary">{sentChallenges.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {renderChallenges(
              activeChallenges,
              Swords,
              "No active challenges",
              "Accept challenges or create new ones to get started!",
              (challenge) => ({
                onViewResults: () => handleViewResults(challenge),
              })
            )}
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            {renderChallenges(
              receivedChallenges,
              Inbox,
              "No pending challenges",
              "You don't have any pending challenges from friends",
              (challenge) => ({
                onAccept: () => handleAccept(challenge.id),
                onDecline: () => handleDecline(challenge.id),
              })
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {renderChallenges(
              sentChallenges,
              Send,
              "No sent challenges",
              "Challenge your friends to compete on quizzes!",
              (challenge) => ({
                onDecline: () => handleCancel(challenge.id),
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreateChallengeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refreshChallenges();
        }}
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
