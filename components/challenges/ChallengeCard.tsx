"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Trophy, Swords, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface ChallengeCardProps {
  challenge: {
    id: string;
    quizId: string;
    quiz: { title: string; slug: string; difficulty: string };
    challenger: { id: string; name: string | null; image: string | null };
    challenged: { id: string; name: string | null; image: string | null };
    challengerScore: number | null;
    challengedScore: number | null;
    status: string;
    createdAt: string;
  };
  currentUserId: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onViewResults?: () => void;
}

export function ChallengeCard({
  challenge,
  currentUserId,
  onAccept,
  onDecline,
  onViewResults,
}: ChallengeCardProps) {
  const isChallenger = currentUserId === challenge.challenger.id;
  const isChallenged = currentUserId === challenge.challenged.id;
  const bothCompleted =
    challenge.challengerScore !== null && challenge.challengedScore !== null;

  const getStatusBadge = () => {
    switch (challenge.status) {
      case "PENDING":
        return <Badge variant="secondary">Pending</Badge>;
      case "ACCEPTED":
        return <Badge variant="default">Accepted</Badge>;
      case "COMPLETED":
        return <Badge variant="default">Completed</Badge>;
      case "DECLINED":
        return <Badge variant="destructive">Declined</Badge>;
      case "EXPIRED":
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return null;
    }
  };

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(challenge.createdAt));

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Challenge</h3>
            </div>
            {getStatusBadge()}
          </div>

          {/* Quiz Info */}
          <Link href={`/quizzes/${challenge.quiz.slug}`}>
            <div className="rounded-lg bg-muted/50 p-3 hover:bg-muted transition-colors">
              <p className="font-medium">{challenge.quiz.title}</p>
              <p className="text-sm text-muted-foreground">
                Difficulty: {challenge.quiz.difficulty}
              </p>
            </div>
          </Link>

          {/* Players */}
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Challenger */}
            <div className="text-center space-y-2">
              <Link href={`/profile/${challenge.challenger.id}`}>
                <UserAvatar
                  src={challenge.challenger.image}
                  alt={challenge.challenger.name || "Challenger"}
                  size="lg"
                  className="mx-auto"
                />
              </Link>
              <div>
                <p className="text-sm font-medium truncate">
                  {isChallenger
                    ? "You"
                    : challenge.challenger.name || "Anonymous"}
                </p>
                {challenge.challengerScore !== null && (
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{challenge.challengerScore.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* VS */}
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">VS</span>
              </div>
            </div>

            {/* Challenged */}
            <div className="text-center space-y-2">
              <Link href={`/profile/${challenge.challenged.id}`}>
                <UserAvatar
                  src={challenge.challenged.image}
                  alt={challenge.challenged.name || "Challenged"}
                  size="lg"
                  className="mx-auto"
                />
              </Link>
              <div>
                <p className="text-sm font-medium truncate">
                  {isChallenged ? "You" : challenge.challenged.name || "Anonymous"}
                </p>
                {challenge.challengedScore !== null && (
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{challenge.challengedScore.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>

            <div className="flex gap-2">
              {challenge.status === "PENDING" && isChallenged && (
                <>
                  {onAccept && (
                    <Button size="sm" onClick={onAccept}>
                      Accept
                    </Button>
                  )}
                  {onDecline && (
                    <Button size="sm" variant="outline" onClick={onDecline}>
                      Decline
                    </Button>
                  )}
                </>
              )}

              {challenge.status === "ACCEPTED" && (
                <>
                  {isChallenger && challenge.challengerScore === null && (
                    <Link href={`/quizzes/${challenge.quiz.slug}/play`}>
                      <Button size="sm">Take Quiz</Button>
                    </Link>
                  )}
                  {isChallenged && challenge.challengedScore === null && (
                    <Link href={`/quizzes/${challenge.quiz.slug}/play`}>
                      <Button size="sm">Take Quiz</Button>
                    </Link>
                  )}
                  {bothCompleted && onViewResults && (
                    <Button size="sm" variant="default" onClick={onViewResults}>
                      <Trophy className="mr-1 h-4 w-4" />
                      View Results
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

