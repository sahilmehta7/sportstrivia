import { Fragment } from "react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Trophy, Star } from "lucide-react";

interface GridAnswer {
    questionId: string;
    questionText: string;
    isCorrect: boolean;
    textAnswer?: string | null;
    totalPoints: number;
    basePoints: number;
    gridData?: {
        rarity: number;
        pickedByPercent: number;
        acceptedAnswers: string[];
    };
}

interface GridResultsProps {
    quizTitle: string;
    gridConfig: {
        rows: string[];
        cols: string[];
    };
    answers: GridAnswer[];
    totalScore: number;
    correctCount: number;
}

export function GridResults({
    quizTitle,
    gridConfig = { rows: [], cols: [] },
    answers = [],
    totalScore,
    correctCount,
}: GridResultsProps) {
    // Find rarest correct pick
    const correctAnswers = answers.filter((a) => a.isCorrect);
    const rarestPick = correctAnswers.length > 0
        ? correctAnswers.reduce((rarest, a) => {
            const currentPercent = a.gridData?.pickedByPercent ?? 100;
            const rarestPercent = rarest.gridData?.pickedByPercent ?? 100;
            return currentPercent < rarestPercent ? a : rarest;
        })
        : null;

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            {/* Summary card */}
            <Card className="rounded-sm border-border shadow-athletic">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold uppercase tracking-wider font-barlow">
                        {quizTitle} — Results
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {/* Score */}
                            <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-accent" />
                                <span className="text-2xl font-bold text-accent tabular-nums">
                                    {totalScore}
                                </span>
                                <span className="text-sm text-muted-foreground">pts</span>
                            </div>

                            {/* Correct count */}
                            <div className="text-sm">
                                <span className="font-bold text-foreground">{correctCount}</span>
                                <span className="text-muted-foreground">/9 correct</span>
                            </div>
                        </div>

                        {/* Rarest pick */}
                        {rarestPick && (
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Star className="h-3 w-3 text-accent" />
                                    Rarest pick
                                </div>
                                <span className="text-sm font-semibold text-accent">
                                    {rarestPick.textAnswer}
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">
                                    ({rarestPick.gridData?.pickedByPercent ?? 0}%)
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Results grid */}
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                {/* Corner */}
                <div className="flex items-center justify-center rounded-sm bg-card/50 min-h-[50px]">
                    <span className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest">
                        Grid
                    </span>
                </div>

                {/* Column headers */}
                {gridConfig.cols.map((col, i) => (
                    <div
                        key={`col-${i}`}
                        className="flex items-center justify-center px-1 py-2 rounded-sm bg-primary/10 border border-primary/20"
                    >
                        <span className="text-xs font-bold text-primary uppercase tracking-wider text-center leading-tight">
                            {col}
                        </span>
                    </div>
                ))}

                {/* Rows */}
                {gridConfig.rows.map((row, rowIndex) => (
                    <Fragment key={`row-${rowIndex}`}>
                        <div
                            key={`row-header-${rowIndex}`}
                            className="flex items-center justify-center px-1 py-2 rounded-sm bg-primary/10 border border-primary/20"
                        >
                            <span className="text-xs font-bold text-primary uppercase tracking-wider text-center leading-tight">
                                {row}
                            </span>
                        </div>

                        {gridConfig.cols.map((_, colIndex) => {
                            const cellIndex = rowIndex * 3 + colIndex;
                            const answer = answers[cellIndex];
                            if (!answer) return <div key={`empty-${cellIndex}`} className="min-h-[90px]" />;

                            return (
                                <div
                                    key={answer.questionId}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-sm border-2 min-h-[90px]",
                                        answer.isCorrect
                                            ? "border-success/60 bg-success/10"
                                            : "border-destructive/60 bg-destructive/10"
                                    )}
                                >
                                    {answer.isCorrect ? (
                                        <>
                                            <Check className="h-4 w-4 text-success" />
                                            <span className="text-[10px] font-semibold text-success text-center leading-tight line-clamp-2">
                                                {answer.textAnswer}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="text-[8px] px-1 py-0 h-4 border-accent/40 text-accent font-bold"
                                            >
                                                +{answer.totalPoints}
                                            </Badge>
                                        </>
                                    ) : (
                                        <>
                                            <X className="h-4 w-4 text-destructive" />
                                            <span className="text-[10px] text-destructive/80 text-center leading-tight line-clamp-2">
                                                {answer.textAnswer || "—"}
                                            </span>
                                        </>
                                    )}

                                    {/* Accepted answers (revealed) */}
                                    {answer.gridData?.acceptedAnswers && answer.gridData.acceptedAnswers.length > 0 ? (
                                        <div className="mt-1 w-full">
                                            <span className="text-[8px] text-muted-foreground block text-center">
                                                Accepted: {answer.gridData.acceptedAnswers.slice(0, 3).join(", ")}
                                                {answer.gridData.acceptedAnswers.length > 3 && ` +${answer.gridData.acceptedAnswers.length - 3}`}
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </Fragment>
                ))}
            </div>
        </div>
    );
}
