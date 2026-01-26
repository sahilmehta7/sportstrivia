import { Metadata } from 'next';
import { getScheduledGames } from '@/lib/services/daily-game.service';
import { DailyGamesAdminClient } from './DailyGamesAdminClient';
import { getISTDateString } from '@/lib/utils/daily-game-logic';

export const metadata: Metadata = {
    title: 'Daily Games | Admin',
    description: 'Manage daily Wordle-style games',
};

export const dynamic = 'force-dynamic';

export default async function DailyGamesAdminPage() {
    // Get games for the next 30 days
    const today = getISTDateString();
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
    const endDate = getISTDateString(thirtyDaysOut);

    const games = await getScheduledGames(today, endDate);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Daily Games</h1>
                    <p className="text-muted-foreground">
                        Manage scheduled daily Wordle-style games
                    </p>
                </div>
            </div>

            <DailyGamesAdminClient initialGames={games} />
        </div>
    );
}
