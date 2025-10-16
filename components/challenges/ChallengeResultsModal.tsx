"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Trophy, Target, Award } from "lucide-react";
import Link from "next/link";

interface ChallengeResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: {
    id: string;
    quiz: { title: string; slug: string };
    challenger: {
      id: string;
      name: string | null;
      image: string | null;
    };
    challenged: {
      id: string;
      name: string | null;
      image: string | null;
    };
    challengerScore: number;
    challengedScore: number;
  };
  currentUserId: string;
}

export function ChallengeResultsModal({
  isOpen,
  onClose,
  challenge,
  currentUserId,
}: ChallengeResultsModalProps) {
  const { challengerScore, challengedScore } = challenge;
  const winner =
    challengerScore > challengedScore
      ? "challenger"
      : challengedScore > challengerScore
        ? "challenged"
        : "tie";

  const isCurrentUserWinner =
    (winner === "challenger" && currentUserId === challenge.challenger.id) ||
    (winner === "challenged" && currentUserId === challenge.challenged.id);

  const isCurrentUserLoser =
    (winner === "challenger" && currentUserId === challenge.challenged.id) ||
    (winner === "challenged" && currentUserId === challenge.challenger.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Challenge Results
          </DialogTitle>
          <DialogDescription>{challenge.quiz.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Winner Announcement */}
          {winner !== "tie" && (
            <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
              <CardContent className="pt-6 text-center">
                <Award className="mx-auto h-12 w-12 text-yellow-500 mb-2" />
                <p className="text-2xl font-bold">
                  {isCurrentUserWinner && "You Win! 🎉"}
                  {isCurrentUserLoser && "You Lose"}
                  {!isCurrentUserWinner && !isCurrentUserLoser && (
                    <>
                      {winner === "challenger"
                        ? challenge.challenger.name || "Challenger"
                        : challenge.challenged.name || "Challenged"}{" "}
                      Wins!
                    </>
                  )}
                </p>
                {winner !== "tie" && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Score difference:{" "}
                    {Math.abs(challengerScore - challengedScore).toFixed(1)}%
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {winner === "tie" && (
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">It&apos;s a Tie! 🤝</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Both players scored exactly the same!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Score Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Challenger */}
            <Card
              className={
                winner === "challenger"
                  ? "border-yellow-500/50 bg-yellow-500/5"
                  : ""
              }
            >
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <UserAvatar
                    src={challenge.challenger.image}
                    alt={challenge.challenger.name || "Challenger"}
                    size="lg"
                    className="mx-auto"
                  />
                  <div>
                    <p className="font-semibold">
                      {currentUserId === challenge.challenger.id
                        ? "You"
                        : challenge.challenger.name || "Challenger"}
                    </p>
                    {winner === "challenger" && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                        Winner
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">
                        {challengerScore.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Challenged */}
            <Card
              className={
                winner === "challenged"
                  ? "border-yellow-500/50 bg-yellow-500/5"
                  : ""
              }
            >
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <UserAvatar
                    src={challenge.challenged.image}
                    alt={challenge.challenged.name || "Challenged"}
                    size="lg"
                    className="mx-auto"
                  />
                  <div>
                    <p className="font-semibold">
                      {currentUserId === challenge.challenged.id
                        ? "You"
                        : challenge.challenged.name || "Challenged"}
                    </p>
                    {winner === "challenged" && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                        Winner
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">
                        {challengedScore.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-center">
            <Link href={`/quizzes/${challenge.quiz.slug}`}>
              <Button variant="outline">View Quiz</Button>
            </Link>
            <Link href={`/quizzes/${challenge.quiz.slug}/play`}>
              <Button>Take Quiz Again</Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

