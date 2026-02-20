"use client";

import { useEffect, useState } from "react";
import { GridResults } from "./GridResults";
import { GridQuiz, GridAttempt, GridAnswer } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GridResultsPageProps {
    quizSlug: string;
    attemptId: string;
}

type AttemptWithDetails = GridAttempt & {
    gridQuiz: GridQuiz;
    answers: GridAnswer[];
};

export default function GridResultsPage({ quizSlug: _quizSlug, attemptId }: GridResultsPageProps) {
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState<AttemptWithDetails | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchResults = async () => {
            try {
                // We can fetch attempt details. Need an API route for this if not existing.
                // Currently we have /api/grids/[id]/attempt (POST), we need a GET for attempt details.
                const res = await fetch(`/api/grids/attempts/${attemptId}`);
                if (!res.ok) throw new Error("Failed to fetch results");
                const data = await res.json();
                setAttempt(data.data);
            } catch (error) {
                console.error(error);
                toast({ title: "Error", description: "Failed to load results.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [attemptId, toast]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!attempt) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-muted-foreground">Results not found.</p>
            </div>
        );
    }

    // Map GridAnswer to the format expected by GridResults
    const gridAnswers = Array(9).fill(null).map((_, i) => {
        const r = Math.floor(i / 3);
        const c = i % 3;
        const cellId = `${r}-${c}`;
        const ans = attempt.answers.find(a => a.cellId === cellId);

        if (!ans) return null;

        return {
            questionId: ans.id,
            questionText: "", // Not used in display usually
            isCorrect: ans.isValid,
            textAnswer: ans.playerInput,
            totalPoints: 1, // Simple scoring for now
            basePoints: 1,
            gridData: {
                rarity: ans.rarityScore || 0,
                pickedByPercent: ans.rarityScore || 0,
                acceptedAnswers: [], // We don't have this in attempt usually
            }
        };
    }).filter(Boolean) as any[];

    return (
        <GridResults
            quizTitle={attempt.gridQuiz.title}
            gridConfig={{
                rows: attempt.gridQuiz.rows as string[],
                cols: attempt.gridQuiz.cols as string[],
            }}
            answers={gridAnswers}
            totalScore={attempt.score}
            correctCount={attempt.score}
        />
    );
}
