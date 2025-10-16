"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { ChallengeCard } from "@/components/challenges/ChallengeCard";
import { ChallengeResultsModal } from "@/components/challenges/ChallengeResultsModal";
import { CreateChallengeModal } from "@/components/challenges/CreateChallengeModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { useToast } from "@/hooks/use-toast";
import { Swords, Inbox, Send, Plus } from "lucide-react";

interface Challenge {
  id: string;
  quizId: string;
  quiz: { title: string; slug: string; difficulty: string };
  challenger: { id: string; name: string | null; image: string | null };
  challenged: { id: string; name: string | null; image: string | null };
  challengerScore: number | null;
  challengedScore: number | null;
  status: string;
  createdAt: string;
}

export default function ChallengesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [receivedChallenges, setReceivedChallenges] = useState<Challenge[]>([]);
  const [sentChallenges, setSentChallenges] = useState<Challenge[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(
    null
  );

  const loadCurrentUser = useCallback(async () => {
    try {
      const response = await fetch("/api/users/me");
      const result = await response.json();
      if (response.ok) {
        setCurrentUserId(result.data.user.id);
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    }
  }, []);

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const [activeRes, receivedRes, sentRes] = await Promise.all([
        fetch("/api/challenges?status=ACCEPTED"),
        fetch("/api/challenges?type=received&status=PENDING"),
        fetch("/api/challenges?type=sent&status=PENDING"),
      ]);

      const [activeData, receivedData, sentData] = await Promise.all([
        activeRes.json(),
        receivedRes.json(),
        sentRes.json(),
      ]);

      if (activeRes.ok) {
        setActiveChallenges(activeData.data?.challenges || []);
      }

      if (receivedRes.ok) {
        setReceivedChallenges(receivedData.data?.challenges || []);
      }

      if (sentRes.ok) {
        setSentChallenges(sentData.data?.challenges || []);
      }
    } catch (error) {
      console.error("Failed to load challenges:", error);
      toast({
        title: "Error",
        description: "Failed to load challenges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadChallenges();
    void loadCurrentUser();
  }, [loadChallenges, loadCurrentUser]);

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

      loadChallenges();
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

      loadChallenges();
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

      loadChallenges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
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
              {activeChallenges.length === 0 ? (
                <EmptyState
                  icon={Swords}
                  title="No active challenges"
                  description="Accept challenges or create new ones to get started!"
                />
              ) : (
                activeChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    currentUserId={currentUserId}
                    onViewResults={() => setSelectedChallenge(challenge)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="received" className="space-y-4">
              {receivedChallenges.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="No pending challenges"
                  description="You don't have any pending challenges from friends"
                />
              ) : (
                receivedChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    currentUserId={currentUserId}
                    onAccept={() => handleAccept(challenge.id)}
                    onDecline={() => handleDecline(challenge.id)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="sent" className="space-y-4">
              {sentChallenges.length === 0 ? (
                <EmptyState
                  icon={Send}
                  title="No sent challenges"
                  description="Challenge your friends to compete on quizzes!"
                />
              ) : (
                sentChallenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    currentUserId={currentUserId}
                    onDecline={() => handleCancel(challenge.id)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <CreateChallengeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadChallenges();
        }}
      />

      {selectedChallenge && (
        <ChallengeResultsModal
          isOpen={true}
          onClose={() => setSelectedChallenge(null)}
          challenge={{
            ...selectedChallenge,
            challengerScore: selectedChallenge.challengerScore!,
            challengedScore: selectedChallenge.challengedScore!,
          }}
          currentUserId={currentUserId}
        />
      )}
    </main>
  );
}
