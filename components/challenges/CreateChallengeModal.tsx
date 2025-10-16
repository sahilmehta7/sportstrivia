"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedQuizId?: string;
  preselectedFriendId?: string;
}

interface Friend {
  id: string;
  friend: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Quiz {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
}

export function CreateChallengeModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedQuizId,
  preselectedFriendId,
}: CreateChallengeModalProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState(
    preselectedFriendId || ""
  );
  const [selectedQuizId, setSelectedQuizId] = useState(preselectedQuizId || "");
  const [expiresInHours, setExpiresInHours] = useState("24");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [friendsRes, quizzesRes] = await Promise.all([
        fetch("/api/friends?type=friends"),
        fetch("/api/quizzes?limit=50&status=PUBLISHED"),
      ]);

      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriends(friendsData.data?.friendships || []);
      }

      if (quizzesRes.ok) {
        const quizzesData = await quizzesRes.json();
        setQuizzes(quizzesData.data?.quizzes || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFriendId || !selectedQuizId) {
      toast({
        title: "Missing information",
        description: "Please select both a friend and a quiz",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengedId: selectedFriendId,
          quizId: selectedQuizId,
          expiresInHours: parseInt(expiresInHours),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create challenge");
      }

      toast({
        title: "Success",
        description: "Challenge sent successfully!",
      });

      onSuccess();
      onClose();
      router.push("/challenges");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create challenge",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Challenge</DialogTitle>
          <DialogDescription>
            Challenge a friend to beat your score on a quiz!
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="friend">Select Friend *</Label>
              <Select
                value={selectedFriendId}
                onValueChange={setSelectedFriendId}
                disabled={!!preselectedFriendId}
              >
                <SelectTrigger id="friend">
                  <SelectValue placeholder="Choose a friend" />
                </SelectTrigger>
                <SelectContent>
                  {friends.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No friends available
                    </div>
                  ) : (
                    friends.map((friendship) => (
                      <SelectItem
                        key={friendship.friend.id}
                        value={friendship.friend.id}
                      >
                        {friendship.friend.name || friendship.friend.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz">Select Quiz *</Label>
              <Select
                value={selectedQuizId}
                onValueChange={setSelectedQuizId}
                disabled={!!preselectedQuizId}
              >
                <SelectTrigger id="quiz">
                  <SelectValue placeholder="Choose a quiz" />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      No quizzes available
                    </div>
                  ) : (
                    quizzes.map((quiz) => (
                      <SelectItem key={quiz.id} value={quiz.id}>
                        {quiz.title} ({quiz.difficulty})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">Challenge Expires In</Label>
              <Select value={expiresInHours} onValueChange={setExpiresInHours}>
                <SelectTrigger id="expires">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="168">7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !selectedFriendId ||
                  !selectedQuizId ||
                  friends.length === 0
                }
              >
                {isSubmitting ? "Sending..." : "Send Challenge"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

