import { NextRequest, NextResponse } from 'next/server';
import { getISTDateString, DailyGameType } from '@/lib/utils/daily-game-logic';
import { upsertDailyGame, getScheduledGames } from '@/lib/services/daily-game.service';

/**
 * Vercel Cron job to auto-schedule daily games
 * Runs daily at midnight IST (18:30 UTC previous day)
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/daily-games",
 *     "schedule": "30 18 * * *"
 *   }]
 * }
 */

// Sports-related 5-letter words for WORD mode
const SPORTS_WORDS = [
    'SCORE', 'TITLE', 'DRIVE', 'SLICE', 'SWEEP', 'COACH', 'FIELD', 'TRACK',
    'MATCH', 'RALLY', 'SERVE', 'BLOCK', 'GUARD', 'POINT', 'DRAFT', 'TRADE',
    'CLEAT', 'SPEED', 'ARENA', 'PITCH', 'THROW', 'CATCH', 'SWING', 'SPIKE',
    'MEDAL', 'CHAMP', 'FINAL', 'ROUND', 'BLANK', 'PUNCH'
];

// Athletes for ATHLETE mode
const ATHLETES = [
    { name: 'LEBRON JAMES', clues: { team: 'Lakers', league: 'NBA', position: 'SF', number: 23 } },
    { name: 'VIRAT KOHLI', clues: { team: 'RCB', league: 'IPL', position: 'Batsman', number: 18 } },
    { name: 'LIONEL MESSI', clues: { team: 'Inter Miami', league: 'MLS', position: 'RW', number: 10 } },
    { name: 'STEPHEN CURRY', clues: { team: 'Warriors', league: 'NBA', position: 'PG', number: 30 } },
    { name: 'CRISTIANO RONALDO', clues: { team: 'Al Nassr', league: 'SPL', position: 'CF', number: 7 } },
    { name: 'SERENA WILLIAMS', clues: { sport: 'Tennis', country: 'USA', grandSlams: 23 } },
    { name: 'TOM BRADY', clues: { team: 'Retired', league: 'NFL', position: 'QB', rings: 7 } },
    { name: 'ROGER FEDERER', clues: { sport: 'Tennis', country: 'Switzerland', grandSlams: 20 } }
];

// Teams for TEAM mode
const TEAMS = [
    { name: 'WARRIORS', clues: { league: 'NBA', city: 'San Francisco', conference: 'Western' } },
    { name: 'MUMBAI INDIANS', clues: { league: 'IPL', city: 'Mumbai', titles: 5 } },
    { name: 'REAL MADRID', clues: { league: 'La Liga', city: 'Madrid', country: 'Spain' } },
    { name: 'PATRIOTS', clues: { league: 'NFL', city: 'Boston', conference: 'AFC' } },
    { name: 'LAKERS', clues: { league: 'NBA', city: 'Los Angeles', championships: 17 } },
    { name: 'MAN UNITED', clues: { league: 'Premier League', city: 'Manchester', country: 'England' } }
];

// Stats for STAT mode
const STATS = [
    { description: 'Sachin Tendulkar Test Centuries', value: '51', player: 'Sachin Tendulkar' },
    { description: 'Michael Jordan Championship Rings', value: '6', player: 'Michael Jordan' },
    { description: 'Usain Bolt 100m World Record', value: '9.58', player: 'Usain Bolt' },
    { description: 'Wayne Gretzky Career Goals', value: '894', player: 'Wayne Gretzky' },
    { description: 'Neeraj Chopra Olympic Throw', value: '87.58', player: 'Neeraj Chopra' }
];

function getGameTypeForDay(dayIndex: number): DailyGameType {
    const types: DailyGameType[] = ['WORD', 'ATHLETE', 'TEAM', 'STAT'];
    return types[dayIndex % types.length];
}

function getGameContent(gameType: DailyGameType, seed: number): { targetValue: string; clues: Record<string, unknown> } {
    switch (gameType) {
        case 'WORD': {
            const word = SPORTS_WORDS[seed % SPORTS_WORDS.length];
            return { targetValue: word, clues: { length: word.length, hint: 'Sports-related term' } };
        }
        case 'ATHLETE': {
            const athlete = ATHLETES[seed % ATHLETES.length];
            return { targetValue: athlete.name, clues: athlete.clues };
        }
        case 'TEAM': {
            const team = TEAMS[seed % TEAMS.length];
            return { targetValue: team.name, clues: team.clues };
        }
        case 'STAT': {
            const stat = STATS[seed % STATS.length];
            return { targetValue: stat.value, clues: { description: stat.description, player: stat.player } };
        }
    }
}

export async function GET(request: NextRequest) {
    // Verify cron secret or manual trigger
    const cronSecret = request.headers.get('x-cron-secret');
    const authHeader = request.headers.get('authorization');

    if (cronSecret !== process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Allow in development or if accessing from Vercel
        const isVercel = request.headers.get('x-vercel-cron') === '1';
        if (!isVercel && process.env.NODE_ENV !== 'development') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        // Get existing scheduled games
        const today = new Date();
        const thirtyDaysOut = new Date();
        thirtyDaysOut.setDate(today.getDate() + 30);

        const existingGames = await getScheduledGames(
            getISTDateString(today),
            getISTDateString(thirtyDaysOut)
        );

        const existingDates = new Set(existingGames.map((g: { date: string }) => g.date));
        let created = 0;

        // Schedule games for the next 30 days that don't already exist
        for (let i = 0; i < 30; i++) {
            const gameDate = new Date(today);
            gameDate.setDate(today.getDate() + i);
            const dateString = getISTDateString(gameDate);

            if (existingDates.has(dateString)) continue;

            const gameType = getGameTypeForDay(i);
            const { targetValue, clues } = getGameContent(gameType, i);

            await upsertDailyGame({
                date: dateString,
                gameType,
                targetValue,
                clues,
            });

            created++;
        }

        return NextResponse.json({
            success: true,
            message: `Scheduled ${created} new games`,
            existing: existingGames.length,
            created,
        });
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json(
            { error: 'Failed to schedule games' },
            { status: 500 }
        );
    }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
    return GET(request);
}
