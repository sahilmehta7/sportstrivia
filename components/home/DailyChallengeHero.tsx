'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Trophy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DailyGameType } from '@/lib/utils/daily-game-logic';
import { cn } from '@/lib/utils';
import { getGradientText, getChipStyles } from '@/lib/showcase-theme';

interface DailyChallengeHeroProps {
    gameId?: string;
    gameType?: DailyGameType;
    displayName?: string;
    gameNumber?: number;
    isCompleted?: boolean;
    solved?: boolean;
    guessCount?: number;
    maxGuesses?: number;
}

const gameTypeLabels: Record<DailyGameType, string> = {
    WORD: 'WORD',
    ATHLETE: 'ATHLETE',
    TEAM: 'TEAM',
    STAT: 'STAT',
};

export function DailyChallengeHero({
    gameId,
    gameType = 'WORD',
    displayName = 'Daily Challenge',
    gameNumber = 1,
    isCompleted = false,
    solved = false,
    guessCount = 0,
    maxGuesses = 6,
}: DailyChallengeHeroProps) {
    const [timeUntilReset, setTimeUntilReset] = useState<string>('');

    // Calculate countdown to midnight IST
    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const istOffset = 5.5 * 60 * 60 * 1000;
            const istNow = new Date(now.getTime() + istOffset);

            // Calculate next midnight IST
            const tomorrow = new Date(istNow);
            tomorrow.setUTCHours(24, 0, 0, 0);

            const diff = tomorrow.getTime() - istNow.getTime();

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeUntilReset(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative border border-border bg-card"
        >
            {/* Accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

            {/* Content */}
            <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="space-y-3">
                        {/* Badge row */}
                        <div className="flex items-center gap-3">
                            <span className={cn(getChipStyles('accent'), 'text-[10px] px-2 py-0.5')}>
                                {gameTypeLabels[gameType]}
                            </span>
                            <span className="text-xs font-mono text-muted-foreground">
                                #{gameNumber.toString().padStart(3, '0')}
                            </span>
                        </div>

                        {/* Title */}
                        <h2 className={cn(
                            "text-3xl sm:text-4xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif]",
                            getGradientText('editorial')
                        )}>
                            DAILY CHALLENGE
                        </h2>

                        <p className="text-sm text-muted-foreground uppercase tracking-wide">
                            A new puzzle every day at midnight IST
                        </p>
                    </div>

                    {/* Timer */}
                    <div className="text-right">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-widest mb-2">
                            <Clock className="w-3 h-3" />
                            Resets in
                        </div>
                        <div className="font-mono text-2xl font-bold text-foreground tracking-tight">
                            {timeUntilReset}
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-border mb-6" />

                {/* Status & Action */}
                {isCompleted ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {solved ? (
                                <>
                                    <div className="flex items-center justify-center w-12 h-12 border border-accent bg-accent/10">
                                        <Trophy className="w-5 h-5 text-accent" />
                                    </div>
                                    <div>
                                        <p className="font-bold uppercase tracking-wide text-foreground">
                                            Solved
                                        </p>
                                        <p className="text-sm text-muted-foreground font-mono">
                                            {guessCount}/{maxGuesses} attempts
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-center w-12 h-12 border border-border bg-muted">
                                        <CheckCircle className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-bold uppercase tracking-wide text-foreground">
                                            Game Over
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Return tomorrow for a new challenge
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        <Link href="/daily">
                            <Button variant="outline" className="uppercase tracking-widest text-xs font-bold">
                                View Results
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <Link href="/daily" className="block">
                        <Button
                            size="lg"
                            className={cn(
                                "w-full h-14 text-sm font-bold uppercase tracking-[0.2em] gap-3",
                                "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                        >
                            <span className="font-['Barlow_Condensed',sans-serif] text-lg">
                                ENTER THE ARENA
                            </span>
                            <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                )}
            </div>
        </motion.div>
    );
}
