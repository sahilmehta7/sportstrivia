
"use client";

import { useState, useEffect,  useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { GridHeader } from "./GridHeader";
import { GridBoard, GridStateItem } from "./GridBoard";
import { PlayerSearchModal } from "./PlayerSearchModal";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import confetti from "canvas-confetti";
import { Loader2 } from "lucide-react";

interface ImmaculateGridProps {
    quizId: string;
    quizTitle: string;
    quizSlug: string;
}

interface GridPlayConfig {
    rows: string[];
    cols: string[];
    scoring?: any;
}

interface Question {
    id: string;
    questionText: string; // "Row: X, Col: Y"
}

export function ImmaculateGrid({ quizId, quizTitle, quizSlug }: ImmaculateGridProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [initLoading, setInitLoading] = useState(true);

    // Game State
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [gridConfig, setGridConfig] = useState<GridPlayConfig | null>(null);
    const [gridState, setGridState] = useState<GridStateItem[][]>([]);
    const [questions, setQuestions] = useState<Question[]>([]); // 0-8
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(9);
    const [gameStatus, setGameStatus] = useState<"playing" | "completed" | "lost">("playing");

    // Modal State
    const [activeCell, setActiveCell] = useState<{ r: number, c: number } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Initialization
    useEffect(() => {
        const initGame = async () => {
            try {
                setInitLoading(true);
                // Create or resume attempt
                const res = await fetch("/api/attempts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ quizId }),
                });

                if (!res.ok) throw new Error("Failed to start game");

                const data = await res.json();
                const attempt = data.data.attempt;
                // API returns playConfig at top level for new attempts, 
                // or we might need to fallback if structure changes.
                const config = data.data.playConfig || data.data.quiz?.playConfig;
                const questionsList = data.data.questions || [];

                setAttemptId(attempt.id);
                setGridConfig(config);
                setQuestions(questionsList);

                // Initialize Grid State (3x3)
                // Check for existing answers in attempt (resume behavior)
                const initialGrid: GridStateItem[][] = Array(3).fill(null).map((_, r) =>
                    Array(3).fill(null).map((_, c) => ({
                        row: r,
                        col: c,
                        state: "empty"
                    }))
                );

                // TODO: Resume logic would map `attempt.answers` to grid cells here.
                // For now, we assume a fresh start or simple resume logic logic is needed.
                // If the user refreshes, they might lose progress unless we fetch answers.

                setGridState(initialGrid);
                setInitLoading(false);
                trackEvent("grid_start", { quizId, quizTitle });

            } catch (error) {
                console.error(error);
                toast({ title: "Error", description: "Could not load the grid.", variant: "destructive" });
            }
        };

        initGame();
    }, [quizId, quizTitle, toast]);

    // Timing State
    // helper ref for tracking time spent
    const answerStartTimeRef = useRef<number>(0);

    // Handle Cell Click
    const onCellClick = (r: number, c: number) => {
        if (gameStatus !== "playing") return;

        const cell = gridState[r][c];
        if (cell.state !== "empty" && cell.state !== "active") return;

        // Reset other active cells and set new active
        setGridState(prev => prev.map(row => row.map(cell => ({
            ...cell,
            state: (cell.row === r && cell.col === c) ? "active" : (cell.state === "active" ? "empty" : cell.state)
        }))));

        setActiveCell({ r, c });
        answerStartTimeRef.current = Date.now();
        setIsModalOpen(true);
    };

    // Handle Modal Close (Cancel)
    const onModalClose = () => {
        setIsModalOpen(false);
        if (activeCell) {
            setGridState(prev => prev.map(row => row.map(cell => ({
                ...cell,
                state: cell.state === "active" ? "empty" : cell.state
            }))));
            setActiveCell(null);
        }
    };

    // Handle Answer Submission
    const onSubmitAnswer = async (answer: string) => {
        if (!attemptId || !activeCell || !gridConfig) return;

        const { r, c } = activeCell;
        const questionIndex = r * 3 + c;
        const question = questions[questionIndex];
        if (!question) {
            toast({ title: "Error", description: "Question not found for this cell.", variant: "destructive" });
            return;
        }

        const timeSpent = Math.max(1, Math.round((Date.now() - answerStartTimeRef.current) / 1000));

        try {
            const res = await fetch(`/api/attempts/${attemptId}/answers/text`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionId: question.id,
                    textAnswer: answer,
                    timeSpent
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit answer");

            const result = data.data; // { isCorrect, matchedAnswerText, rarity, totalPoints, etc. }

            // Update Grid State
            setGridState(prev => {
                const newGrid = [...prev.map(row => [...row])];
                const cell = newGrid[r][c];

                if (result.isCorrect) {
                    cell.state = "correct";
                    cell.playerName = result.matchedAnswerText;
                    // cell.playerImageUrl = ... // Backend doesn't send image yet?
                    cell.rarity = result.rarity ? result.rarity * 100 : 0; // Convert to %
                    cell.points = result.totalPoints;

                    // Track Event
                    trackEvent("grid_correct", { quizId, cell: `${r}x${c}`, rarity: cell.rarity });
                } else {
                    cell.state = "wrong";
                    setLives(l => Math.max(0, l - 1));
                    trackEvent("grid_wrong", { quizId, cell: `${r}x${c}` });
                }

                return newGrid;
            });

            if (result.isCorrect) {
                setScore(s => s + (result.totalPoints || 0));
                // Trigger Confetti if game won (all 9 correct)
                // Check if all correct
                const _isWin = gridState.flat().filter(c => c.state === "correct").length + 1 === 9; // +1 because state update is pending? No, use functional update above or check logic.
                // Actually we can't check 'newGrid' easily inside async without variables.
                // Let's rely on effect or simple check.
                // We won't trigger confetti here immediately to avoid complex state logic, 
                // but we could if we tracked correct count.
            } else {
                // Check Game Over
                if (lives - 1 <= 0) {
                    setGameStatus("lost");
                    toast({ title: "Game Over", description: "You ran out of lives!", variant: "destructive" });
                    router.push(`/quizzes/${quizSlug}/results/${attemptId}`);
                }
            }

            onModalClose();

        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to submit answer. Please try again.", variant: "destructive" });
            setIsModalOpen(false); // Close anyway or keep open? Keep open allows retry.
        }
    };

    // Game Over / Win Logic interactions
    useEffect(() => {
        if (lives === 0 && gameStatus !== "lost") {
            setGameStatus("lost");
            // Maybe delay redirect?
        }
    }, [lives, gameStatus]);

    useEffect(() => {
        const correctCount = gridState.flat().filter(c => c.state === "correct").length;
        if (correctCount === 9 && gameStatus !== "completed") {
            setGameStatus("completed");
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 }
            });
            setTimeout(() => {
                router.push(`/quizzes/${quizSlug}/results/${attemptId}`);
            }, 3000);
        }
    }, [gridState, gameStatus, attemptId, quizSlug, router]);


    if (initLoading || !gridConfig) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-6 md:py-10 animate-in fade-in duration-500">

            <GridHeader
                quizTitle={quizTitle}
                score={score}
                lives={lives}
                maxLives={9}
            />

            <GridBoard
                rows={gridConfig.rows}
                cols={gridConfig.cols}
                gridState={gridState}
                onCellClick={onCellClick}
            />

            <div className="mt-12 flex gap-4">
                <Button variant="ghost" className="text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => {
                        if (confirm("Are you sure you want to give up?")) {
                            router.push(`/quizzes/${quizSlug}/results/${attemptId}`);
                        }
                    }}
                >
                    Give Up
                </Button>
            </div>

            {activeCell && (
                <PlayerSearchModal
                    isOpen={isModalOpen}
                    onClose={onModalClose}
                    onSubmit={onSubmitAnswer}
                    rowLabel={gridConfig.rows[activeCell.r]}
                    colLabel={gridConfig.cols[activeCell.c]}
                />
            )}
        </div>
    );
}
