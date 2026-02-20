
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import {  Trophy } from "lucide-react";

interface GridHeaderProps {
    quizTitle: string;
    score: number;
    maxScore?: number;
    lives: number;
    maxLives?: number;
    className?: string;
}

export function GridHeader({
    quizTitle,
    score,
    maxScore: _maxScore = 0,
    lives,
    maxLives = 9,
    className
}: GridHeaderProps) {

    // Create life pips array
    const lifePips = Array.from({ length: maxLives }, (_, i) => i < lives);

    return (
        <div className={cn("flex flex-col gap-4 w-full max-w-2xl mx-auto mb-6", className)}>
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="border-primary text-primary font-bold tracking-widest text-[10px] uppercase">
                            Grid Mode
                        </Badge>
                        <h1 className="text-lg font-bold tracking-tight md:text-xl line-clamp-1">
                            {quizTitle}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {/* Score Box */}
                    <div className="flex items-center gap-1.5 bg-card border rounded-md px-3 py-1 shadow-sm">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span className="font-mono font-bold text-lg">{Math.round(score)}</span>
                    </div>
                </div>
            </div>

            {/* Lives / Progress Bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground uppercase font-medium tracking-wider">
                    <span>Attempts Remaining</span>
                    <span className={cn(lives <= 3 ? "text-rose-500 font-bold" : "")}>
                        {lives} / {maxLives}
                    </span>
                </div>

                {/* Visual Pips for Lives */}
                <div className="flex gap-1 h-2">
                    {lifePips.map((isAlive, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex-1 rounded-full transition-all duration-500",
                                isAlive
                                    ? "bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                    : "bg-muted opacity-30"
                            )}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
