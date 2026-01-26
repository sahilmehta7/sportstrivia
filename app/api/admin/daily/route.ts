import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getScheduledGames, upsertDailyGame, deleteDailyGame } from '@/lib/services/daily-game.service';
import { z } from 'zod';
import type { DailyGameType } from '@/lib/utils/daily-game-logic';

const createGameSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    gameType: z.enum(['WORD', 'ATHLETE', 'TEAM', 'STAT']),
    targetValue: z.string().min(1).max(100),
    clues: z.record(z.unknown()).optional(),
});

/**
 * GET /api/admin/daily
 * Get all scheduled daily games
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;

        const games = await getScheduledGames(startDate, endDate);

        return NextResponse.json({ games });
    } catch (error) {
        console.error('Error fetching daily games:', error);
        return NextResponse.json(
            { error: 'Failed to fetch daily games' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/daily
 * Create or update a daily game
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const data = createGameSchema.parse(body);

        const game = await upsertDailyGame({
            date: data.date,
            gameType: data.gameType as DailyGameType,
            targetValue: data.targetValue,
            clues: data.clues,
        });

        return NextResponse.json({ game });
    } catch (error) {
        console.error('Error creating daily game:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to create daily game' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/daily
 * Delete a daily game
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id || session.user.role !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Game ID is required' },
                { status: 400 }
            );
        }

        await deleteDailyGame(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting daily game:', error);
        return NextResponse.json(
            { error: 'Failed to delete daily game' },
            { status: 500 }
        );
    }
}
