"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { FriendsList } from "@/components/friends/FriendsList";
import { FriendRequests } from "@/components/friends/FriendRequests";
import { AddFriendForm } from "@/components/friends/AddFriendForm";
import { ChallengesList } from "@/components/features/social/ChallengesList";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, Inbox, UserPlus, Swords } from "lucide-react";

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
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  friend: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  createdAt: string;
}

interface Challenge {
  id: string;
  challengerId: string;
  quizId: string;
  challengerScore: number | null;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "COMPLETED";
  createdAt: Date;
  challenger: {
    id: string;
    name: string | null;
    image: string | null;
  };
  quiz: {
    id: string;
    title: string;
    slug: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    sport: string | null;
  };
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
      (friendship) =>
        friendship.friend.name?.toLowerCase().includes(searchLower) ||
        friendship.friend.email.toLowerCase().includes(searchLower)
    );
  }, [friends, search]);

  const refresh = () => {
    router.refresh();
  };

  const handleAccept = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to accept request");
      }

      toast({
        title: "Success",
        description: "Friend request accepted",
      });

      refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to accept request",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to decline request");
      }

      toast({
        title: "Success",
        description: "Friend request declined",
      });

      refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to decline request",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (friendshipId: string) => {
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

      refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove friend",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (requestId: string) => {
    try {
      const response = await fetch(`/api/friends/${requestId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to cancel request");
      }

      toast({
        title: "Success",
        description: "Friend request cancelled",
      });

      refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel request",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4">
        <PageHeader
          title="Friends"
          description="Manage your friends and challenge them to quizzes"
        />

        <Tabs defaultValue="friends" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">My Friends</span>
              <Badge variant="secondary">{friends.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Swords className="h-4 w-4" />
              <span className="hidden sm:inline">Challenges</span>
              {challenges.length > 0 && (
                <Badge variant="default" className="bg-orange-500 hover:bg-orange-600">
                  {challenges.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              <span className="hidden sm:inline">Requests</span>
              {receivedRequests.length > 0 && (
                <Badge variant="default">{receivedRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Friend</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <FriendsList friends={filteredFriends} onRemove={handleRemove} />
          </TabsContent>

          <TabsContent value="challenges">
            <ChallengesList challenges={challenges} />
          </TabsContent>

          <TabsContent value="requests">
            <FriendRequests
              received={receivedRequests}
              sent={sentRequests}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onCancel={handleCancel}
            />
          </TabsContent>

          <TabsContent value="add">
            <AddFriendForm onSuccess={refresh} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
