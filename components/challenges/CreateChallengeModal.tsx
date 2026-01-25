"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Trophy, ArrowRight, Target } from "lucide-react";
import { searchQuizzes, createChallenge } from "@/app/actions/challenge-actions";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
      <DialogContent className="sm:max-w-2xl bg-background border border-border shadow-2xl p-0 overflow-hidden sm:rounded-2xl gap-0 max-h-[90vh] flex flex-col">

        <DialogHeader className="p-6 pb-6 border-b border-border bg-muted/10 shrink-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground">
                Initiate Challenge
              </DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                Select a tactical scenario for your opponent
              </DialogDescription>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shadow-sm hidden sm:flex">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 bg-background space-y-6 flex-1 overflow-hidden flex flex-col">
          <div className="relative shrink-0">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors" />
            <Input
              placeholder="SEARCH OPERATIONS DATABASE..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 bg-muted/30 border-input h-14 text-base font-medium focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all placeholder:text-muted-foreground/50 placeholder:uppercase placeholder:text-sm placeholder:tracking-wider placeholder:font-bold rounded-xl"
            />
          </div>

          <div className="-mr-2 pr-2 overflow-y-auto flex-1 custom-scrollbar">
            <AnimatePresence mode="wait">
              {loading && quizzes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 space-y-3"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Accessing Archives...</p>
                </motion.div>
              ) : quizzes.length > 0 ? (
                <div className="grid gap-3 pb-2">
                  {quizzes.map((quiz, index) => (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.25 }}
                      className="group relative flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/30 hover:border-primary/30 transition-all duration-200 cursor-pointer"
                      onClick={() => handleChallenge(quiz)}
                    >
                      <div className="space-y-2 mr-6 shrink min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] h-5 px-1.5 rounded-md border text-center font-bold tracking-wider uppercase",
                              quiz.difficulty === 'HARD' ? "bg-red-500/5 text-red-600 border-red-200 dark:border-red-900/30" :
                                quiz.difficulty === 'MEDIUM' ? "bg-amber-500/5 text-amber-600 border-amber-200 dark:border-amber-900/30" :
                                  "bg-emerald-500/5 text-emerald-600 border-emerald-200 dark:border-emerald-900/30"
                            )}
                          >
                            {quiz.difficulty}
                          </Badge>
                          {quiz.sport && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                              <Target className="h-3 w-3" />
                              {quiz.sport}
                            </div>
                          )}
                        </div>
                        <h4 className="font-black text-lg text-foreground group-hover:text-primary transition-colors uppercase tracking-tight leading-6 line-clamp-2">
                          {quiz.title}
                        </h4>
                      </div>

                      <div className="shrink-0">
                        <Button
                          size="icon"
                          disabled={sending === quiz.id}
                          className={cn(
                            "rounded-full h-10 w-10 transition-all duration-300",
                            sending === quiz.id
                              ? "bg-background border border-border text-muted-foreground"
                              : "bg-primary text-primary-foreground group-hover:scale-105 shadow-md group-hover:shadow-primary/20"
                          )}
                        >
                          {sending === quiz.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ArrowRight className="h-5 w-5" />
                          )}
                        </Button>
                      </div>

                      {/* Full card click effect */}
                      <span className="absolute inset-0 rounded-xl ring-2 ring-primary/20 ring-offset-2 ring-offset-background opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 space-y-4 text-center opacity-60"
                >
                  <div className="h-16 w-16 rounded-full bg-muted/50 border border-border flex items-center justify-center">
                    <Search className="h-8 w-8 text-muted-foreground/60" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">No matches found</p>
                    <p className="text-[10px] text-muted-foreground/60 font-medium max-w-[200px] mx-auto">Try adjusting your search criteria</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
