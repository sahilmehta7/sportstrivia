"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Trophy } from "lucide-react";
import { searchQuizzes, createChallenge } from "@/app/actions/challenge-actions";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedQuizId?: string;
  preselectedFriendId?: string;
}

interface Quiz {
  id: string;
  title: string;
  sport: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  description: string | null;
  questionCount: number | null;
}

export function CreateChallengeModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedFriendId
}: CreateChallengeModalProps) {
  const [search, setSearch] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 500);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setQuizzes([]);
      handleSearch("");
    }
  }, [isOpen]);

  useEffect(() => {
    handleSearch(debouncedSearch);
  }, [debouncedSearch]);

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const results = await searchQuizzes(query);
      setQuizzes(results);
    } catch (error) {
      console.error("Failed to search quizzes", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChallenge = async (quiz: Quiz) => {
    if (!preselectedFriendId) return;

    setSending(quiz.id);
    try {
      const result = await createChallenge(preselectedFriendId, quiz.id);
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Challenge Sent!",
          description: `Challenge sent for ${quiz.title}.`,
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send challenge",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send a Challenge</DialogTitle>
          <DialogDescription>
            Search for a quiz to challenge your friend. They&apos;ll have to beat your best score!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search quizzes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {loading && quizzes.length === 0 ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : quizzes.length > 0 ? (
              quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1 overflow-hidden mr-3">
                    <h4 className="font-semibold truncate text-sm">{quiz.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] h-5">
                        {quiz.difficulty}
                      </Badge>
                      {quiz.sport && <span>• {quiz.sport}</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={sending === quiz.id}
                    onClick={() => handleChallenge(quiz)}
                    className="shrink-0"
                  >
                    {sending === quiz.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trophy className="h-4 w-4 mr-1" />
                    )}
                    Challenge
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No quizzes found.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
