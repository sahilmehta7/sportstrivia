import { prisma } from '@/lib/db';
import {
    getISTDateString,
    evaluateWordleGuess,
    isWordleWin,
    getMaxGuesses,
    LetterResult,
    DailyGameType
} from '@/lib/utils/daily-game-logic';

// Local type definitions to avoid TypeScript server sync issues with Prisma
export interface DailyGame {
    id: string;
    date: string;
    gameType: DailyGameType;
    targetValue: string;
    clues: unknown | null;
    quizId: string | null;
    createdAt: Date;
    updatedAt: Date;
    attempts?: DailyGameAttempt[];
}

export interface DailyGameAttempt {
    id: string;
    dailyGameId: string;
    userId: string;
    guesses: unknown;
    solved: boolean;
    guessCount: number;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    dailyGame?: DailyGame;
}

export type DailyGameWithAttempt = DailyGame & {
    userAttempt?: DailyGameAttempt | null;
};

/**
 * Get today's daily game
 */
export async function getTodaysGame(userId?: string): Promise<DailyGameWithAttempt | null> {
    const today = getISTDateString();

    const game = await (prisma as any).dailyGame.findUnique({
        where: { date: today },
        include: userId ? {
            attempts: {
                where: { userId },
                take: 1,
            },
        } : undefined,
    });

    if (!game) return null;

    return {
        ...game,
        userAttempt: userId ? game.attempts?.[0] || null : null,
    } as DailyGameWithAttempt;
}

/**
 * Get a daily game by date
 */
export async function getGameByDate(date: string, userId?: string): Promise<DailyGameWithAttempt | null> {
    const game = await (prisma as any).dailyGame.findUnique({
        where: { date },
        include: userId ? {
            attempts: {
                where: { userId },
                take: 1,
            },
        } : undefined,
    });

    if (!game) return null;

    return {
        ...game,
        userAttempt: userId ? game.attempts?.[0] || null : null,
    } as DailyGameWithAttempt;
}

export interface GuessResult {
    success: boolean;
    isCorrect: boolean;
    gameOver: boolean;
    feedback: LetterResult[] | Record<string, unknown>;
    attempt: DailyGameAttempt;
    message?: string;
}

/**
 * Submit a guess for a daily game
 */
export async function submitGuess(
    gameId: string,
    userId: string,
    guess: string
): Promise<GuessResult> {
    // Get the game
    const game = await (prisma as any).dailyGame.findUnique({
        where: { id: gameId },
    });

    if (!game) {
        throw new Error('Game not found');
    }

    // Check if today's game
    const today = getISTDateString();
    if (game.date !== today) {
        throw new Error('This game is not available today');
    }

    // Get or create attempt
    let attempt = await (prisma as any).dailyGameAttempt.findUnique({
        where: {
            dailyGameId_userId: {
                dailyGameId: gameId,
                userId,
            },
        },
    });

    if (attempt?.solved) {
        throw new Error('You have already solved this game');
    }

    const maxGuesses = getMaxGuesses(game.gameType);
    const currentGuesses = (attempt?.guesses as string[]) || [];

    if (currentGuesses.length >= maxGuesses) {
        throw new Error('No more guesses remaining');
    }

    // Evaluate the guess based on game type
    let feedback: LetterResult[] | Record<string, unknown>;
    let isCorrect = false;

    switch (game.gameType) {
        case 'WORD':
            feedback = evaluateWordleGuess(guess, game.targetValue);
            isCorrect = isWordleWin(guess, game.targetValue);
            break;
        case 'ATHLETE':
        case 'TEAM':
            // For athlete/team, we just check if the name matches
            isCorrect = guess.toUpperCase() === game.targetValue.toUpperCase();
            feedback = { match: isCorrect, guessedName: guess };
            break;
        case 'STAT': {
            const guessNum = parseFloat(guess);
            const targetNum = parseFloat(game.targetValue);
            isCorrect = guessNum === targetNum;
            feedback = {
                match: isCorrect,
                direction: guessNum < targetNum ? 'higher' : guessNum > targetNum ? 'lower' : 'correct',
            };
            break;
        }
        default:
            feedback = {};
    }

    // Update or create attempt
    const newGuesses = [...currentGuesses, guess.toUpperCase()];
    const gameOver = isCorrect || newGuesses.length >= maxGuesses;

    if (attempt) {
        attempt = await (prisma as any).dailyGameAttempt.update({
            where: { id: attempt.id },
            data: {
                guesses: newGuesses,
                guessCount: newGuesses.length,
                solved: isCorrect,
                completedAt: gameOver ? new Date() : null,
            },
        });
    } else {
        attempt = await (prisma as any).dailyGameAttempt.create({
            data: {
                dailyGameId: gameId,
                userId,
                guesses: newGuesses,
                guessCount: newGuesses.length,
                solved: isCorrect,
                completedAt: gameOver ? new Date() : null,
            },
        });
    }

    // Award XP if solved
    if (isCorrect) {
        const xpAward = calculateXP(game.gameType, newGuesses.length);
        await awardXP(userId, xpAward);
    }

    return {
        success: true,
        isCorrect,
        gameOver,
        feedback,
        attempt,
        message: isCorrect ? 'Congratulations! You solved it!' : gameOver ? `Game over! The answer was ${game.targetValue}` : undefined,
    };
}

/**
 * Calculate XP based on game type and number of guesses
 */
function calculateXP(gameType: DailyGameType, guesses: number): number {
    const baseXP = 50;
    const maxGuesses = getMaxGuesses(gameType);

    // Bonus for solving in fewer guesses
    const speedBonus = Math.max(0, (maxGuesses - guesses) * 10);

    return baseXP + speedBonus;
}

/**
 * Award XP to a user
 */
async function awardXP(userId: string, xp: number): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: {
            totalPoints: { increment: xp },
        },
    });
}

/**
 * Get user's daily game stats
 */
export async function getUserDailyStats(userId: string) {
    const attempts = await (prisma as any).dailyGameAttempt.findMany({
        where: { userId },
        include: { dailyGame: true },
        orderBy: { createdAt: 'desc' },
    });

    const totalPlayed = attempts.length;
    const totalWon = attempts.filter((a: DailyGameAttempt) => a.solved).length;
    const winRate = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;

    // Calculate current streak
    let currentStreak = 0;
    const sortedAttempts = [...attempts].sort((a: DailyGameAttempt, b: DailyGameAttempt) =>
        new Date(b.dailyGame!.date).getTime() - new Date(a.dailyGame!.date).getTime()
    );

    for (const attempt of sortedAttempts) {
        if (attempt.solved) {
            currentStreak++;
        } else {
            break;
        }
    }

    // Guess distribution for WORD games
    const wordAttempts = attempts.filter((a: DailyGameAttempt) => a.dailyGame?.gameType === 'WORD' && a.solved);
    const guessDistribution = [0, 0, 0, 0, 0, 0]; // 1-6 guesses
    for (const attempt of wordAttempts) {
        const guesses = attempt.guessCount;
        if (guesses >= 1 && guesses <= 6) {
            guessDistribution[guesses - 1]++;
        }
    }

    return {
        totalPlayed,
        totalWon,
        winRate,
        currentStreak,
        guessDistribution,
    };
}

/**
 * Get all scheduled games for admin
 */
export async function getScheduledGames(startDate?: string, endDate?: string) {
    const where: { date?: { gte?: string; lte?: string } } = {};

    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
    }

    return (prisma as any).dailyGame.findMany({
        where,
        orderBy: { date: 'asc' },
        include: {
            _count: {
                select: { attempts: true },
            },
        },
    });
}

/**
 * Create or update a daily game
 */
export async function upsertDailyGame(data: {
    date: string;
    gameType: DailyGameType;
    targetValue: string;
    clues?: Record<string, unknown>;
}) {
    return (prisma as any).dailyGame.upsert({
        where: { date: data.date },
        update: {
            gameType: data.gameType,
            targetValue: data.targetValue.toUpperCase(),
            clues: data.clues || null,
        },
        create: {
            date: data.date,
            gameType: data.gameType,
            targetValue: data.targetValue.toUpperCase(),
            clues: data.clues || null,
        },
    });
}

/**
 * Delete a daily game
 */
export async function deleteDailyGame(id: string) {
    return (prisma as any).dailyGame.delete({
        where: { id },
    });
}

