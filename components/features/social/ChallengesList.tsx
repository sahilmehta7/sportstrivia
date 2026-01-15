"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Swords, Trophy, Check, X, Loader2 } from "lucide-react";
import { respondToChallenge } from "@/app/actions/challenge-actions";
import { useToast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

interface ChallengesListProps {
    challenges: Challenge[];
}

export function ChallengesList({ challenges }: ChallengesListProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleRespond = async (challengeId: string, action: "accept" | "decline") => {
        setProcessingId(challengeId);
        try {
            const result = await respondToChallenge(challengeId, action);
            if (result.error) {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: action === "accept" ? "Challenge Accepted!" : "Challenge Declined",
                    description: action === "accept" ? "Good luck!" : undefined,
                });
                if (action === "accept") {
                    // Find the quiz slug to redirect
                    const challenge = challenges.find((c) => c.id === challengeId);
                    if (challenge) {
                        router.push(`/quizzes/${challenge.quiz.slug}`);
                    } else {
                        router.refresh();
                    }
                } else {
                    router.refresh();
                }
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to respond to challenge",
                variant: "destructive",
            });
        } finally {
            setProcessingId(null);
        }
    };

    if (challenges.length === 0) {
        return (
            <EmptyState
                icon={Trophy}
                title="No active challenges"
                description="Challenge your friends to a quiz to get started!"
            />
        );
    }

    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {challenges.map((challenge) => (
                <Card key={challenge.id} className="overflow-hidden">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <UserAvatar
                                src={challenge.challenger.image}
                                alt={challenge.challenger.name || "Challenger"}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">
                                    <span className="font-bold">{challenge.challenger.name}</span> challenged you!
                                </p>
                                <div className="mt-1 flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        {challenge.quiz.difficulty}
                                    </Badge>
                                    {challenge.quiz.sport && (
                                        <span className="text-xs text-muted-foreground">{challenge.quiz.sport}</span>
                                    )}
                                </div>
                                <h4 className="mt-2 font-semibold text-sm truncate" title={challenge.quiz.title}>
                                    {challenge.quiz.title}
                                </h4>
                                {challenge.challengerScore !== null && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Target Score: <span className="font-bold text-primary">{challenge.challengerScore}%</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Button
                                className="flex-1"
                                size="sm"
                                onClick={() => handleRespond(challenge.id, "accept")}
                                disabled={!!processingId}
                            >
                                {processingId === challenge.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        <Swords className="h-4 w-4 mr-1" /> Accept
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRespond(challenge.id, "decline")}
                                disabled={!!processingId}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
