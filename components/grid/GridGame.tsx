"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { GridHeader } from "./GridHeader";
import { GridBoard, GridStateItem } from "./GridBoard";
import { PlayerSearchModal } from "./PlayerSearchModal";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import confetti from "canvas-confetti";
import { Loader2 } from "lucide-react";
import { GridQuiz } from "@prisma/client";

interface GridGameProps {
    grid: GridQuiz;
    userId: string;
}

export function GridGame({ grid, userId: _userId }: GridGameProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [initLoading, setInitLoading] = useState(true);

    // Game State
    const [attemptId, setAttemptId] = useState<string | null>(null);
    const [gridState, setGridState] = useState<GridStateItem[][]>([]);
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
                const res = await fetch(`/api/grids/${grid.id}/attempt`, {
                    method: "POST",
                });

                if (!res.ok) throw new Error("Failed to start game");

                const data = await res.json();
                const attempt = data.data;

                setAttemptId(attempt.id);

                // Initialize Grid State (3x3)
                // TODO: If resuming, fetch existing answers and populate grid
                const initialGrid: GridStateItem[][] = Array(3).fill(null).map((_, r) =>
                    Array(3).fill(null).map((_, c) => ({
                        row: r,
                        col: c,
                        state: "empty"
                    }))
                );

                setGridState(initialGrid);
                setInitLoading(false);
                trackEvent("grid_start", { quizId: grid.id, quizTitle: grid.title });

            } catch (error) {
                console.error(error);
                toast({ title: "Error", description: "Could not load the grid.", variant: "destructive" });
            }
        };

        initGame();
    }, [grid.id, grid.title, toast]);

    // Timing
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

    // Handle Modal Close
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
        if (!attemptId || !activeCell) return;

        const { r, c } = activeCell;

        try {
            const res = await fetch(`/api/grids/${grid.id}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    attemptId,
                    cellRow: r,
                    cellCol: c,
                    answer,
                })
            });

            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.error || "Failed to submit answer");

            const result = responseData.data; // { isCorrect, rarity, message }

            // Update Grid State
            setGridState(prev => {
                const newGrid = [...prev.map(row => [...row])];
                const cell = newGrid[r][c];

                if (result.isCorrect) {
                    cell.state = "correct";
                    cell.playerName = answer; // Or matched name from backend if available
                    cell.rarity = (result.rarity || 0) * 1; // Assuming rarity is 0-100? Backend sent 1-20 mocked.
                    // cell.points = ... 

                    trackEvent("grid_correct", { quizId: grid.id, cell: `${r}x${c}`, rarity: cell.rarity });
                    setScore(s => s + 1);
                } else {
                    cell.state = "wrong";
                    setLives(l => Math.max(0, l - 1));
                    trackEvent("grid_wrong", { quizId: grid.id, cell: `${r}x${c}` });
                }

                return newGrid;
            });

            // Check Win/Loss
            if (result.isCorrect) {
                // Check if all filled
                // We need to wait for state update or check explicitly
                const correctCount = gridState.flat().filter(c => c.state === "correct").length + 1;
                if (correctCount === 9) {
                    setGameStatus("completed");
                    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                    // Navigate to results
                    setTimeout(() => router.push(`/grids/${grid.slug}/results/${attemptId}`), 2000);
                }
            } else {
                if (lives - 1 <= 0) {
                    setGameStatus("lost");
                    toast({ title: "Game Over", description: "You ran out of lives!", variant: "destructive" });
                    setTimeout(() => router.push(`/grids/${grid.slug}/results/${attemptId}`), 2000);
                }
            }

            onModalClose();

        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to submit answer.", variant: "destructive" });
            // Do not close modal on error to allow retry? 
            // Or close it?
            setIsModalOpen(false);
        }
    };

    if (initLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    const rows = grid.rows as string[];
    const cols = grid.cols as string[];

    return (
        <div className="min-h-screen bg-background flex flex-col items-center py-6 md:py-10 animate-in fade-in duration-500">

            <GridHeader
                quizTitle={grid.title}
                score={score}
                lives={lives}
                maxLives={9}
            />

            <GridBoard
                rows={rows}
                cols={cols}
                gridState={gridState}
                onCellClick={onCellClick}
            />

            <div className="mt-12 flex gap-4">
                <Button variant="ghost" className="text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => {
                        if (confirm("Are you sure you want to give up?")) {
                            router.push(`/grids/${grid.slug}/results/${attemptId}`);
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
                    rowLabel={rows[activeCell.r]}
                    colLabel={cols[activeCell.c]}
                />
            )}
        </div>
    );
}
