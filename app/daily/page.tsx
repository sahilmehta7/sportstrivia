import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { getTodaysGame } from '@/lib/services/daily-game.service';
import { getMaxGuesses, getGameTypeDisplayName, getISTDateString } from '@/lib/utils/daily-game-logic';
import { DailyGameClient } from './DailyGameClient';
import { cn } from '@/lib/utils';
import { getGradientText, getChipStyles } from '@/lib/showcase-theme';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Daily Challenge | SportsTrivia',
    description: 'Test your sports knowledge with our daily puzzle. A new challenge every day at midnight IST!',
};

export const dynamic = 'force-dynamic';

export default async function DailyPage() {
    const session = await auth();
    const game = await getTodaysGame(session?.user?.id);

    if (!game) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center p-8 bg-card border border-border max-w-md">
                    <div className="w-1 h-12 bg-muted-foreground mx-auto mb-6" />
                    <h1 className={cn(
                        "text-3xl font-bold uppercase tracking-tighter font-['Barlow_Condensed',sans-serif] mb-4",
                        getGradientText('editorial')
                    )}>
                        NO GAME TODAY
                    </h1>
                    <p className="text-muted-foreground uppercase tracking-wide text-sm">
                        Check back later for today&apos;s challenge
                    </p>
                </div>
            </div>
        );
    }

    const maxGuesses = getMaxGuesses(game.gameType);
    const displayName = getGameTypeDisplayName(game.gameType);
    const isCompleted = game.userAttempt?.solved ||
        (game.userAttempt?.guessCount ?? 0) >= maxGuesses;

    // Calculate game number (days since start)
    const startDate = new Date('2026-01-26');
    const today = new Date(getISTDateString());
    const gameNumber = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Get word length for WORD games
    const wordLength = game.gameType === 'WORD'
        ? game.targetValue.length
        : undefined;

    return (
        <div className="min-h-screen py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Back link */}
                <Link
                    href="/quizzes"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 uppercase tracking-wide"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Quizzes
                </Link>

                {/* Header */}
                <div className="text-center mb-10">
                    {/* Badge row */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <span className={cn(getChipStyles('accent'), 'text-[10px] px-2 py-0.5')}>
                            {game.gameType}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                            #{gameNumber.toString().padStart(3, '0')}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className={cn(
                        "text-5xl sm:text-6xl font-bold uppercase tracking-tighter font-['Barlow_Condensed',sans-serif] mb-3",
                        getGradientText('editorial')
                    )}>
                        {displayName.toUpperCase()}
                    </h1>

                    {/* Meta info */}
                    <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground uppercase tracking-wide">
                        <span className="font-mono">{game.date}</span>
                        <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                        <span>{maxGuesses} attempts</span>
                    </div>

                    {!session && (
                        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 border border-warning/30 bg-warning/5">
                            <span className="text-sm text-warning uppercase tracking-wide">
                                Sign in to save progress & earn XP
                            </span>
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="flex items-center justify-center mb-10">
                    <div className="h-px w-24 bg-border" />
                    <div className="w-2 h-2 border border-border rotate-45 mx-4" />
                    <div className="h-px w-24 bg-border" />
                </div>

                {/* Game */}
                <DailyGameClient
                    gameId={game.id}
                    gameType={game.gameType}
                    maxGuesses={maxGuesses}
                    wordLength={wordLength}
                    clues={game.clues as Record<string, unknown> | undefined}
                    initialGuesses={(game.userAttempt?.guesses as string[]) || []}
                    isCompleted={isCompleted}
                    targetValue={isCompleted ? game.targetValue : undefined}
                    gameNumber={gameNumber}
                />
            </div>
        </div>
    );
}
