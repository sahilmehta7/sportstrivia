
import { PrismaClient } from '@prisma/client';
import { getTodaysGame } from '@/lib/services/daily-game.service';

async function main() {
    try {
        console.log('Fetching today\'s game details...');
        const game = await getTodaysGame();

        if (game) {
            console.log('\n--- DAILY GAME DEBUG ---');
            console.log(`ID: ${game.id}`);
            console.log(`Date: ${game.date}`);
            console.log(`Type: ${game.gameType}`);
            console.log(`Target: ${game.targetValue}`);
            console.log('Clues:');
            console.log(JSON.stringify(game.clues, null, 2));
            console.log('Attempts:', game.userAttempt ? 'Found' : 'None');
            console.log('-------------------------\n');
        } else {
            console.log('\nNo game found for today.');
        }
    } catch (error) {
        console.error('Error debugging game:', error);
    } finally {
        process.exit(0);
    }
}

main();
