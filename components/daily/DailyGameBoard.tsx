'use client';

import { DailyGameType } from '@/lib/utils/daily-game-logic';
import { WordleGame } from './WordleGame';
import { AthleteGuessGame } from './AthleteGuessGame';
import { StatGuessGame } from './StatGuessGame';
import type { LetterResult, LetterStatus } from '@/lib/utils/daily-game-logic';

interface DailyGameBoardProps {
    gameId: string;
    gameType: DailyGameType;
    maxGuesses: number;
    wordLength?: number;
    clues?: Record<string, unknown>;
    initialGuesses?: string[];
    isCompleted?: boolean;
    targetValue?: string;
    gameNumber: number;
}

/**
 * Main game board that switches between different game types
 */
export function DailyGameBoard({
    gameId,
    gameType,
    maxGuesses,
    wordLength = 5,
    clues,
    initialGuesses = [],
    isCompleted = false,
    targetValue,
    gameNumber,
}: DailyGameBoardProps) {
    switch (gameType) {
        case 'WORD':
            // Convert initial guesses to LetterResult format if we have target
            const letterGuesses: LetterResult[][] = [];
            const letterStatuses: Record<string, LetterStatus> = {};

            if (targetValue && initialGuesses.length > 0) {
                initialGuesses.forEach(guess => {
                    const results: LetterResult[] = [];
                    const targetArr = targetValue.toUpperCase().split('');
                    const guessArr = guess.toUpperCase().split('');
                    const targetUsed = new Array(targetArr.length).fill(false);

                    // First pass: correct
                    guessArr.forEach((letter, i) => {
                        if (letter === targetArr[i]) {
                            results.push({ letter, status: 'correct' });
                            targetUsed[i] = true;
                            letterStatuses[letter] = 'correct';
                        } else {
                            results.push({ letter, status: 'absent' });
                        }
                    });

                    // Second pass: present
                    results.forEach((result, i) => {
                        if (result.status === 'correct') return;
                        for (let j = 0; j < targetArr.length; j++) {
                            if (!targetUsed[j] && guessArr[i] === targetArr[j]) {
                                result.status = 'present';
                                targetUsed[j] = true;
                                if (letterStatuses[result.letter] !== 'correct') {
                                    letterStatuses[result.letter] = 'present';
                                }
                                break;
                            }
                        }
                        if (result.status === 'absent' && !letterStatuses[result.letter]) {
                            letterStatuses[result.letter] = 'absent';
                        }
                    });

                    letterGuesses.push(results);
                });
            }

            return (
                <WordleGame
                    gameId={gameId}
                    wordLength={wordLength}
                    maxGuesses={maxGuesses}
                    initialGuesses={letterGuesses}
                    initialLetterStatuses={letterStatuses}
                    isCompleted={isCompleted}
                    targetWord={targetValue}
                    gameNumber={gameNumber}
                />
            );

        case 'ATHLETE':
        case 'TEAM':
            return (
                <AthleteGuessGame
                    gameId={gameId}
                    maxGuesses={maxGuesses}
                    clues={clues}
                    initialGuesses={initialGuesses}
                    isCompleted={isCompleted}
                    targetValue={targetValue}
                    gameNumber={gameNumber}
                    gameType={gameType}
                />
            );

        case 'STAT':
            return (
                <StatGuessGame
                    gameId={gameId}
                    maxGuesses={maxGuesses}
                    clues={clues as { description?: string; hint?: string }}
                    initialGuesses={initialGuesses}
                    isCompleted={isCompleted}
                    targetValue={targetValue}
                    gameNumber={gameNumber}
                />
            );

        default:
            return (
                <div className="text-center p-8">
                    <p className="text-muted-foreground">Unknown game type</p>
                </div>
            );
    }
}
