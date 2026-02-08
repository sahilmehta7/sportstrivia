'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WordleBoard } from './WordleBoard';
import { VirtualKeyboard } from './VirtualKeyboard';
import { DailyGameResult } from './DailyGameResult';
import type { LetterResult, LetterStatus } from '@/lib/utils/daily-game-logic';
import { useToast } from '@/hooks/use-toast';

interface WordleGameProps {
    gameId: string;
    wordLength: number;
    maxGuesses: number;
    initialGuesses?: LetterResult[][];
    initialLetterStatuses?: Record<string, LetterStatus>;
    isCompleted?: boolean;
    targetWord?: string;
    gameNumber: number;
}

export function WordleGame({
    gameId,
    wordLength,
    maxGuesses,
    initialGuesses = [],
    initialLetterStatuses = {},
    isCompleted = false,
    targetWord,
    gameNumber,
}: WordleGameProps) {
    const [guesses, setGuesses] = useState<LetterResult[][]>(initialGuesses);
    const [solution, setSolution] = useState(targetWord);
    const [currentGuess, setCurrentGuess] = useState('');
    const [letterStatuses, setLetterStatuses] = useState<Record<string, LetterStatus>>(initialLetterStatuses);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRevealing, setIsRevealing] = useState(false);
    const [gameOver, setGameOver] = useState(isCompleted);
    const [won, setWon] = useState(initialGuesses.some(g => g.every(l => l.status === 'correct')));
    const [showResult, setShowResult] = useState(false);
    const { toast } = useToast();

    // Listen for physical keyboard
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameOver || isSubmitting) return;

            if (e.key === 'Enter') {
                handleKeyPress('ENTER');
            } else if (e.key === 'Backspace') {
                handleKeyPress('BACKSPACE');
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                handleKeyPress(e.key.toUpperCase());
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentGuess, gameOver, isSubmitting]);

    const handleKeyPress = useCallback((key: string) => {
        if (gameOver || isSubmitting) return;

        if (key === 'BACKSPACE') {
            setCurrentGuess(prev => prev.slice(0, -1));
        } else if (key === 'ENTER') {
            if (currentGuess.length === wordLength) {
                submitGuess();
            } else {
                toast({
                    title: 'Not enough letters',
                    description: `Word must be ${wordLength} letters`,
                    variant: 'destructive',
                });
            }
        } else if (currentGuess.length < wordLength && /^[A-Z]$/.test(key)) {
            setCurrentGuess(prev => prev + key);
        }
    }, [currentGuess, wordLength, gameOver, isSubmitting]);

    const submitGuess = async () => {
        if (currentGuess.length !== wordLength || isSubmitting) return;

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/daily/guess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId, guess: currentGuess }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit guess');
            }

            // Update letter statuses
            const feedback = data.feedback as LetterResult[];
            const newStatuses = { ...letterStatuses };
            feedback.forEach(({ letter, status }) => {
                // Only upgrade status (absent -> present -> correct)
                const currentStatus = newStatuses[letter];
                if (!currentStatus ||
                    (currentStatus === 'absent' && status !== 'absent') ||
                    (currentStatus === 'present' && status === 'correct')) {
                    newStatuses[letter] = status;
                }
            });
            setLetterStatuses(newStatuses);

            // Animate reveal
            setIsRevealing(true);
            setTimeout(() => {
                setGuesses(prev => [...prev, feedback]);
                setCurrentGuess('');
                setIsRevealing(false);

                if (data.isCorrect || data.gameOver) {
                    setGameOver(true);
                    setWon(data.isCorrect);
                    if (data.solution) {
                        setSolution(data.solution);
                    }
                    setTimeout(() => setShowResult(true), 500);
                }
            }, wordLength * 100 + 500);

        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to submit guess',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 sm:gap-8 py-4">
            <WordleBoard
                guesses={guesses}
                currentGuess={currentGuess}
                maxGuesses={maxGuesses}
                wordLength={wordLength}
                isRevealing={isRevealing}
            />

            <VirtualKeyboard
                onKeyPress={handleKeyPress}
                letterStatuses={letterStatuses}
                disabled={gameOver || isSubmitting || isRevealing}
            />

            <AnimatePresence>
                {showResult && (
                    <DailyGameResult
                        won={won}
                        guesses={guesses}
                        maxGuesses={maxGuesses}
                        gameNumber={gameNumber}
                        targetWord={solution}
                        onClose={() => setShowResult(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
