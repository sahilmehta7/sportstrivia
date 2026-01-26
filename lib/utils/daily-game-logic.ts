// Define locally to avoid TypeScript server sync issues with Prisma
export type DailyGameType = 'WORD' | 'ATHLETE' | 'TEAM' | 'STAT';

/**
 * Get the current date in IST as "YYYY-MM-DD" format
 */
export function getISTDateString(date: Date = new Date()): string {
    // IST is UTC+5:30
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
}

/**
 * Get time until next midnight IST in milliseconds
 */
export function getTimeUntilMidnightIST(): number {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffset);

    const midnight = new Date(istNow);
    midnight.setUTCHours(24, 0, 0, 0);
    midnight.setDate(istNow.getUTCDate() + 1);

    // Calculate difference
    const diff = midnight.getTime() - istNow.getTime();
    return Math.max(0, diff);
}

export type LetterStatus = 'correct' | 'present' | 'absent';

export interface LetterResult {
    letter: string;
    status: LetterStatus;
}

/**
 * Evaluate a Wordle guess against the target word
 * Returns array of letter results with status
 */
export function evaluateWordleGuess(guess: string, target: string): LetterResult[] {
    const guessArr = guess.toUpperCase().split('');
    const targetArr = target.toUpperCase().split('');
    const results: LetterResult[] = guessArr.map(letter => ({ letter, status: 'absent' as LetterStatus }));

    // Track which target letters have been used
    const targetUsed = new Array(targetArr.length).fill(false);

    // First pass: mark correct letters (green)
    for (let i = 0; i < guessArr.length; i++) {
        if (guessArr[i] === targetArr[i]) {
            results[i].status = 'correct';
            targetUsed[i] = true;
        }
    }

    // Second pass: mark present letters (yellow)
    for (let i = 0; i < guessArr.length; i++) {
        if (results[i].status === 'correct') continue;

        for (let j = 0; j < targetArr.length; j++) {
            if (!targetUsed[j] && guessArr[i] === targetArr[j]) {
                results[i].status = 'present';
                targetUsed[j] = true;
                break;
            }
        }
    }

    return results;
}

/**
 * Check if a Wordle guess is a winning guess
 */
export function isWordleWin(guess: string, target: string): boolean {
    return guess.toUpperCase() === target.toUpperCase();
}

export type AttributeComparison = 'match' | 'higher' | 'lower' | 'close' | 'wrong';

export interface AthleteAttributeResult {
    attribute: string;
    value: string | number;
    targetValue: string | number;
    status: AttributeComparison;
}

/**
 * Compare athlete/team attributes for guessing games
 */
export function compareAttributes(
    guessClues: Record<string, unknown>,
    targetClues: Record<string, unknown>
): AthleteAttributeResult[] {
    const results: AthleteAttributeResult[] = [];

    for (const [key, targetValue] of Object.entries(targetClues)) {
        const guessValue = guessClues[key];

        if (guessValue === undefined) continue;

        let status: AttributeComparison = 'wrong';

        if (guessValue === targetValue) {
            status = 'match';
        } else if (typeof guessValue === 'number' && typeof targetValue === 'number') {
            status = guessValue < targetValue ? 'higher' : 'lower';
        } else if (typeof guessValue === 'string' && typeof targetValue === 'string') {
            // Check for "close" matches (e.g., same conference/division)
            if (key === 'conference' || key === 'division' || key === 'league') {
                status = 'wrong';
            }
        }

        results.push({
            attribute: key,
            value: guessValue as string | number,
            targetValue: targetValue as string | number,
            status,
        });
    }

    return results;
}

/**
 * Compare stat guesses (higher/lower)
 */
export function compareStatGuess(guess: number, target: number): 'correct' | 'higher' | 'lower' {
    if (guess === target) return 'correct';
    return guess < target ? 'higher' : 'lower';
}

/**
 * Generate shareable emoji grid for Wordle results
 */
export function generateShareableGrid(
    gameNumber: number,
    guesses: LetterResult[][],
    won: boolean,
    maxGuesses: number = 6
): string {
    const header = `SportsTrivia Daily #${gameNumber} ${won ? guesses.length : 'X'}/${maxGuesses}\n\n`;

    const grid = guesses.map(guess =>
        guess.map(({ status }) => {
            switch (status) {
                case 'correct': return '🟩';
                case 'present': return '🟨';
                case 'absent': return '⬛';
            }
        }).join('')
    ).join('\n');

    return header + grid + '\n\nhttps://sportstrivia.com/daily';
}

/**
 * Get display name for game type
 */
export function getGameTypeDisplayName(gameType: DailyGameType): string {
    switch (gameType) {
        case 'WORD': return 'Word Puzzle';
        case 'ATHLETE': return 'Mystery Athlete';
        case 'TEAM': return 'Mystery Team';
        case 'STAT': return 'Stat Challenge';
        default: return 'Daily Challenge';
    }
}

/**
 * Get max guesses allowed for each game type
 */
export function getMaxGuesses(gameType: DailyGameType): number {
    switch (gameType) {
        case 'WORD': return 6;
        case 'ATHLETE': return 8;
        case 'TEAM': return 8;
        case 'STAT': return 5;
        default: return 6;
    }
}

