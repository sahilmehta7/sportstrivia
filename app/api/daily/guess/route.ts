import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { submitGuess } from '@/lib/services/daily-game.service';
import { z } from 'zod';

const guessSchema = z.object({
    gameId: z.string(),
    guess: z.string().min(1).max(100),
});

/**
 * POST /api/daily/guess
 * Submit a guess for today's game
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'You must be logged in to play' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { gameId, guess } = guessSchema.parse(body);

        const result = await submitGuess(gameId, session.user.id, guess);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error submitting guess:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to submit guess' },
            { status: 500 }
        );
    }
}
