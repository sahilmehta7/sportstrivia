import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserDailyStats } from '@/lib/services/daily-game.service';

/**
 * GET /api/daily/stats
 * Get user's daily game statistics
 */
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'You must be logged in to view stats' },
                { status: 401 }
            );
        }

        const stats = await getUserDailyStats(session.user.id);

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching daily stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 }
        );
    }
}
