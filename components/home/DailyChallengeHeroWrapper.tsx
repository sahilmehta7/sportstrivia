import { auth } from '@/lib/auth';
import { getTodaysGame } from '@/lib/services/daily-game.service';
import { getMaxGuesses, getGameTypeDisplayName, getISTDateString } from '@/lib/utils/daily-game-logic';
import { DailyChallengeHero } from './DailyChallengeHero';

export async function DailyChallengeHeroWrapper() {
    const session = await auth();
    const game = await getTodaysGame(session?.user?.id);

    if (!game) {
        return null;
    }

    const maxGuesses = getMaxGuesses(game.gameType);
    const isCompleted = game.userAttempt?.solved ||
        (game.userAttempt?.guessCount ?? 0) >= maxGuesses;

    // Calculate game number
    const startDate = new Date('2026-01-26');
    const today = new Date(getISTDateString());
    const gameNumber = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return (
        <DailyChallengeHero
            gameId={game.id}
            gameType={game.gameType}
            displayName={getGameTypeDisplayName(game.gameType)}
            gameNumber={gameNumber}
            isCompleted={isCompleted}
            solved={game.userAttempt?.solved}
            guessCount={game.userAttempt?.guessCount}
            maxGuesses={maxGuesses}
        />
    );
}
