"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { FriendsList } from "@/components/friends/FriendsList";
import { FriendRequests } from "@/components/friends/FriendRequests";
import { AddFriendForm } from "@/components/friends/AddFriendForm";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, Inbox, UserPlus } from "lucide-react";

export default function FriendsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const [friendsRes, receivedRes, sentRes] = await Promise.all([
        fetch("/api/friends?type=friends"),
        fetch("/api/friends?type=received"),
        fetch("/api/friends?type=sent"),
      ]);

      const [friendsData, receivedData, sentData] = await Promise.all([
        friendsRes.json(),
        receivedRes.json(),
        sentRes.json(),
      ]);

      setFriends(friendsData.data?.friendships || []);
      setReceivedRequests(receivedData.data?.friendships || []);
      setSentRequests(sentData.data?.friendships || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load friends",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadFriends();
  }, [loadFriends]);

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

      loadFriends();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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

      loadFriends();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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

      loadFriends();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredFriends = friends.filter((f) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      f.friend.name?.toLowerCase().includes(searchLower) ||
      f.friend.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4">
        <PageHeader
          title="Friends"
          description="Manage your friends and challenge them to quizzes"
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <Tabs defaultValue="friends" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                My Friends
                <Badge variant="secondary">{friends.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Requests
                {receivedRequests.length > 0 && (
                  <Badge variant="default">{receivedRequests.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="add" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Friend
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search friends..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Friends List */}
              <FriendsList
                friends={filteredFriends}
                onRemove={handleRemove}
              />
            </TabsContent>

            <TabsContent value="requests">
              <FriendRequests
                received={receivedRequests}
                sent={sentRequests}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onCancel={handleRemove}
              />
            </TabsContent>

            <TabsContent value="add">
              <AddFriendForm onSuccess={loadFriends} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </main>
  );
}
