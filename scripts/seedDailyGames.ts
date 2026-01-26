import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define locally to avoid TypeScript server sync issues with Prisma
type DailyGameType = 'WORD' | 'ATHLETE' | 'TEAM' | 'STAT';

/**
 * Seed data for Daily Wordle-Style Games
 * Creates 30 days of games starting from today (IST timezone)
 */

// Sports-related 5-letter words for WORD mode
const SPORTS_WORDS = [
    'SCORE', 'TITLE', 'DRIVE', 'SLICE', 'SWEEP', 'COACH', 'FIELD', 'TRACK',
    'MATCH', 'RALLY', 'SERVE', 'VOLLEY', 'PUNCH', 'BLOCK', 'GUARD', 'POINT',
    'GOALI', 'DRAFT', 'TRADE', 'CLEAT', 'SPEED', 'ARENA', 'PITCH', 'THROW',
    'CATCH', 'SWING', 'SPIKE', 'DRIBBL', 'TACKLE', 'MEDAL'
];

// Athletes with attributes for ATHLETE mode
const ATHLETES = [
    {
        name: 'LEBRON JAMES',
        clues: { team: 'Lakers', league: 'NBA', position: 'SF', age: 39, number: 23, conference: 'Western', height: '6-9' }
    },
    {
        name: 'VIRAT KOHLI',
        clues: { team: 'RCB', league: 'IPL', position: 'Batsman', age: 35, number: 18, conference: 'N/A', country: 'India' }
    },
    {
        name: 'LIONEL MESSI',
        clues: { team: 'Inter Miami', league: 'MLS', position: 'RW', age: 36, number: 10, conference: 'Eastern', country: 'Argentina' }
    },
    {
        name: 'STEPHEN CURRY',
        clues: { team: 'Warriors', league: 'NBA', position: 'PG', age: 35, number: 30, conference: 'Western', height: '6-2' }
    },
    {
        name: 'CRISTIANO RONALDO',
        clues: { team: 'Al Nassr', league: 'SPL', position: 'CF', age: 39, number: 7, conference: 'N/A', country: 'Portugal' }
    },
    {
        name: 'SERENA WILLIAMS',
        clues: { sport: 'Tennis', country: 'USA', grandSlams: 23, age: 42, handed: 'Right' }
    },
    {
        name: 'TOM BRADY',
        clues: { team: 'Retired', league: 'NFL', position: 'QB', age: 46, number: 12, conference: 'N/A', rings: 7 }
    },
    {
        name: 'ROGER FEDERER',
        clues: { sport: 'Tennis', country: 'Switzerland', grandSlams: 20, age: 42, handed: 'Right' }
    }
];

// Teams for TEAM mode
const TEAMS = [
    {
        name: 'GOLDEN STATE WARRIORS',
        clues: { league: 'NBA', city: 'San Francisco', conference: 'Western', division: 'Pacific', championships: 7, mascot: 'Thunder' }
    },
    {
        name: 'MUMBAI INDIANS',
        clues: { league: 'IPL', city: 'Mumbai', titles: 5, captain: 'Hardik Pandya', color: 'Blue' }
    },
    {
        name: 'REAL MADRID',
        clues: { league: 'La Liga', city: 'Madrid', country: 'Spain', championships: 36, stadium: 'Bernabeu' }
    },
    {
        name: 'NEW ENGLAND PATRIOTS',
        clues: { league: 'NFL', city: 'Boston', conference: 'AFC', division: 'East', superBowls: 6 }
    },
    {
        name: 'LOS ANGELES LAKERS',
        clues: { league: 'NBA', city: 'Los Angeles', conference: 'Western', division: 'Pacific', championships: 17 }
    },
    {
        name: 'MANCHESTER UNITED',
        clues: { league: 'Premier League', city: 'Manchester', country: 'England', championships: 20, stadium: 'Old Trafford' }
    }
];

// Stats for STAT mode (Higher/Lower guessing)
const STATS = [
    {
        name: 'Sachin Tendulkar Test Centuries',
        clues: { player: 'Sachin Tendulkar', category: 'Batting', sport: 'Cricket', hint: 'Most centuries in Test cricket' },
        targetValue: '51'
    },
    {
        name: 'Michael Jordan Championship Rings',
        clues: { player: 'Michael Jordan', category: 'Championships', sport: 'Basketball', hint: 'Bulls dynasty rings' },
        targetValue: '6'
    },
    {
        name: 'Usain Bolt 100m World Record',
        clues: { player: 'Usain Bolt', category: 'Speed', sport: 'Athletics', hint: 'World record time in seconds (format: X.XX)' },
        targetValue: '9.58'
    },
    {
        name: 'Wayne Gretzky Career Goals',
        clues: { player: 'Wayne Gretzky', category: 'Scoring', sport: 'Hockey', hint: 'NHL all-time goals leader' },
        targetValue: '894'
    },
    {
        name: 'Neeraj Chopra Olympic Throw Distance',
        clues: { player: 'Neeraj Chopra', category: 'Distance', sport: 'Javelin', hint: '2020 Tokyo Olympics gold medal throw in meters' },
        targetValue: '87.58'
    }
];

// Get IST date string
function getISTDateString(date: Date): string {
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(date.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
}

// Rotate through game types
function getGameTypeForDay(dayIndex: number): DailyGameType {
    const types: DailyGameType[] = ['WORD', 'ATHLETE', 'TEAM', 'STAT'];
    return types[dayIndex % types.length];
}

async function seedDailyGames() {
    console.log('🎮 Seeding Daily Games for the next 30 days...\n');

    const today = new Date();
    const games = [];

    for (let i = 0; i < 30; i++) {
        const gameDate = new Date(today);
        gameDate.setDate(today.getDate() + i);
        const dateString = getISTDateString(gameDate);
        const gameType = getGameTypeForDay(i);

        let targetValue: string;
        let clues: object | null = null;

        switch (gameType) {
            case 'WORD':
                targetValue = SPORTS_WORDS[i % SPORTS_WORDS.length];
                clues = { length: targetValue.length, hint: 'Sports-related term' };
                break;
            case 'ATHLETE':
                const athlete = ATHLETES[i % ATHLETES.length];
                targetValue = athlete.name;
                clues = athlete.clues;
                break;
            case 'TEAM':
                const team = TEAMS[i % TEAMS.length];
                targetValue = team.name;
                clues = team.clues;
                break;
            case 'STAT':
                const stat = STATS[i % STATS.length];
                targetValue = stat.targetValue;
                clues = { ...stat.clues, description: stat.name };
                break;
            default:
                targetValue = 'SCORE';
        }

        games.push({
            date: dateString,
            gameType,
            targetValue,
            clues,
        });
    }

    // Upsert games (create or update if date already exists)
    for (const game of games) {
        await (prisma as any).dailyGame.upsert({
            where: { date: game.date },
            update: {
                gameType: game.gameType,
                targetValue: game.targetValue,
                clues: game.clues,
            },
            create: {
                date: game.date,
                gameType: game.gameType,
                targetValue: game.targetValue,
                clues: game.clues,
            },
        });
        console.log(`✅ ${game.date} - ${game.gameType}: ${game.targetValue.substring(0, 20)}...`);
    }

    console.log('\n🎉 Successfully seeded 30 days of Daily Games!');
}

async function main() {
    try {
        await seedDailyGames();
    } catch (error) {
        console.error('Error seeding daily games:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

main();

