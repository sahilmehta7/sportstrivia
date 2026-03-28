import { Metadata } from 'next';
import { getScheduledGames } from '@/lib/services/daily-game.service';
import { DailyGamesAdminClient } from './DailyGamesAdminClient';
import { getISTDateString } from '@/lib/utils/daily-game-logic';
import { AdminPaginationClient } from '@/components/admin/AdminPaginationClient';

export const metadata: Metadata = {
    title: 'Daily Games | Admin',
    description: 'Manage daily Wordle-style games',
};

export const dynamic = 'force-dynamic';

interface DailyGamesAdminPageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DailyGamesAdminPage({ searchParams }: DailyGamesAdminPageProps) {
    const params = await searchParams;
    const page = Math.max(
        1,
        Number(typeof params?.page === "string" ? params.page : "1") || 1
    );
    const limit = Math.min(
        100,
        Math.max(1, Number(typeof params?.limit === "string" ? params.limit : "20") || 20)
    );

    // Get games for the next 30 days
    const today = getISTDateString();
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
    const endDate = getISTDateString(thirtyDaysOut);

    const games = await getScheduledGames(today, endDate);
    const total = games.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * limit;
    const pagedGames = games.slice(skip, skip + limit);
    const hasPrevious = safePage > 1;
    const hasNext = safePage < totalPages;

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

            <DailyGamesAdminClient initialGames={pagedGames} />

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                    Showing{" "}
                    <span className="font-medium">
                        {pagedGames.length === 0 ? 0 : skip + 1}-{skip + pagedGames.length}
                    </span>{" "}
                    of <span className="font-medium">{total}</span>
                </div>
                <AdminPaginationClient
                    currentPage={safePage}
                    totalPages={totalPages}
                    hasPrevious={hasPrevious}
                    hasNext={hasNext}
                    variant="server"
                    filterParams={{ limit: limit.toString() }}
                />
            </div>
        </div>
    );
}
