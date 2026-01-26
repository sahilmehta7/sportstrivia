import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTodaysGame } from '@/lib/services/daily-game.service';
import { getTimeUntilMidnightIST, getMaxGuesses, getGameTypeDisplayName } from '@/lib/utils/daily-game-logic';

/**
 * GET /api/daily
 * Get today's daily game
 */
export async function GET() {
    try {
        const session = await auth();
        const userId = session?.user?.id;

        const game = await getTodaysGame(userId);

        if (!game) {
            return NextResponse.json(
                { error: 'No game available today' },
                { status: 404 }
            );
        }

        // Don't expose the target value to the client
        const { targetValue, ...safeGame } = game;

        // Calculate game metadata
        const maxGuesses = getMaxGuesses(game.gameType);
        const displayName = getGameTypeDisplayName(game.gameType);
        const timeUntilReset = getTimeUntilMidnightIST();

        // If game is completed, reveal the answer
        const isCompleted = game.userAttempt?.solved ||
            (game.userAttempt?.guessCount ?? 0) >= maxGuesses;

        return NextResponse.json({
            ...safeGame,
            targetValue: isCompleted ? targetValue : undefined,
            maxGuesses,
            displayName,
            timeUntilReset,
            isCompleted,
        });
    } catch (error) {
        console.error('Error fetching daily game:', error);
        return NextResponse.json(
            { error: 'Failed to fetch daily game' },
            { status: 500 }
        );
    }
}
