"use client";

import {  useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
    Trophy,
    Share2,
    RotateCcw,
    Home,
    CheckCircle2,
    XCircle,
    Sparkles
} from "lucide-react";
import confetti from "canvas-confetti";
import { useToast } from "@/hooks/use-toast";

// Types
interface GridResultAnswer {
    questionId: string;
    questionText: string;
    isCorrect: boolean;
    textAnswer?: string | null;
    gridData?: {
        rarity: number;
        pickedByPercent: number;
        acceptedAnswers: string[];
    };
    basePoints: number;
    totalPoints: number;
}

interface GridResultsPageProps {
    quizTitle: string;
    quizSlug: string;
    attemptId: string;
    score: number;
    totalQuestions: number;
    gridConfig: {
        rows: string[];
        cols: string[];
    };
    answers: GridResultAnswer[];
    user: {
        name: string;
        image?: string | null;
    };
}

export function GridResultsPage({
    quizTitle,
    quizSlug,
    score: _score,
    gridConfig,
    answers = [],
}: GridResultsPageProps) {
    const { toast } = useToast();

    // Safety checks with defaults
    const rows = gridConfig?.rows || [];
    const cols = gridConfig?.cols || [];

    // Stats Calculation
    const correctCount = answers.filter(a => a.isCorrect).length;

    // Rarity Calculation
    const averageRarity = useMemo(() => {
        const correctAnswers = answers.filter(a => a.isCorrect);
        if (correctAnswers.length === 0) return 0;
        const totalRarity = correctAnswers.reduce((sum, a) => sum + (a.gridData?.pickedByPercent || 0), 0);
        return Math.round(totalRarity / correctAnswers.length);
    }, [answers]);

    // Insights
    const rarestFind = useMemo(() => {
        const correct = answers.filter(a => a.isCorrect && a.gridData);
        if (correct.length === 0) return null;
        return correct.reduce((prev, curr) =>
            (prev.gridData!.pickedByPercent < curr.gridData!.pickedByPercent) ? prev : curr
        );
    }, [answers]);

    // Trigger celebration
    useEffect(() => {
        if (correctCount > 4) {
            const end = Date.now() + 1000;
            const colors = ['#10b981', '#a855f7'];

            (function frame() {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: colors
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: colors
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            }());
        }
    }, [correctCount]);

    const handleShare = async () => {
        let gridString = "";
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const idx = r * 3 + c;
                const ans = answers[idx];
                gridString += ans?.isCorrect ? "🟩" : "⬛";
            }
            gridString += "\n";
        }

        const shareText = `IMMACULATE GRID: ${quizTitle}\nScore: ${correctCount}/9\nRarity: ${averageRarity}%\n\n${gridString}\nPlay now: ${window.location.host}/quizzes/${quizSlug}`;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: quizTitle,
                    text: shareText,
                });
            } else {
                await navigator.clipboard.writeText(shareText);
                toast({ title: "Copied to clipboard!", description: "Share your results with friends." });
            }
        } catch (err) {
            console.error("Share failed:", err);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 py-8 animate-in fade-in duration-500">
            {/* Header / Stats */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-bold uppercase tracking-widest">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Results</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{quizTitle}</h1>

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <Card className="border-emerald-500/20 bg-emerald-500/5">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-xs uppercase text-muted-foreground font-bold">Score</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                {correctCount}/9
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-purple-500/20 bg-purple-500/5">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-xs uppercase text-muted-foreground font-bold">Rarity</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-3xl font-black text-purple-600 dark:text-purple-400">
                                {correctCount > 0 ? `${averageRarity}%` : "—"}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Grid */}
            <Card className="overflow-hidden bg-card">
                <CardContent className="p-6">
                    <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-2 md:gap-4 max-w-2xl mx-auto">
                        {/* Corner */}
                        <div className="aspect-square" />

                        {/* Col Headers */}
                        {cols.map((col, i) => (
                            <div key={`col-${i}`} className="flex items-center justify-center text-center p-2">
                                <span className="text-xs font-bold uppercase text-muted-foreground">{col}</span>
                            </div>
                        ))}

                        {/* Rows */}
                        {rows.map((row, r) => (
                            <div key={`row-${r}`} className="contents">
                                {/* Row Header */}
                                <div className="flex items-center justify-center text-center p-2">
                                    <span className="text-xs font-bold uppercase text-muted-foreground vertical-lr md:horizontal-tb">{row}</span>
                                </div>

                                {/* Cells */}
                                {cols.map((_, c) => {
                                    const idx = r * 3 + c;
                                    const answer = answers[idx];
                                    return (
                                        <div
                                            key={`cell-${idx}`}
                                            className={cn(
                                                "aspect-[4/3] rounded-md border flex flex-col items-center justify-center p-1 text-center relative overflow-hidden transition-all",
                                                answer?.isCorrect
                                                    ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                                                    : "bg-muted/50 border-border"
                                            )}
                                        >
                                            {answer?.isCorrect ? (
                                                <>
                                                    <Badge variant="secondary" className="absolute top-1 right-1 text-[9px] px-1 h-3.5 bg-background/80 backdrop-blur-sm">
                                                        {answer.gridData?.pickedByPercent}%
                                                    </Badge>
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-1" />
                                                    <span className="text-[10px] md:text-xs font-semibold leading-tight line-clamp-2">
                                                        {answer.textAnswer}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-4 h-4 text-muted-foreground/30 mb-1" />
                                                    <span className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">
                                                        {answer?.textAnswer || "Empty"}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Rarest Find */}
            {rarestFind && (
                <div className="max-w-md mx-auto">
                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/20 rounded-full text-purple-600 dark:text-purple-400">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400">Rarest Find</div>
                                <div className="font-bold text-foreground">{rarestFind.textAnswer}</div>
                            </div>
                        </div>
                        <div className="text-2xl font-black text-foreground">
                            {rarestFind.gridData?.pickedByPercent}%
                        </div>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Button onClick={handleShare} className="flex-1" size="lg">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Result
                </Button>
                <Link href={`/quizzes/${quizSlug}/play`} className="flex-1">
                    <Button variant="outline" className="w-full" size="lg">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Play Again
                    </Button>
                </Link>
            </div>

            <div className="text-center pt-4">
                <Link href="/quizzes">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <Home className="w-4 h-4 mr-2" />
                        Back to Quizzes
                    </Button>
                </Link>
            </div>
        </div>
    );
}
