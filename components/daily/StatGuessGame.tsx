'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown, Check, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DailyGameResult } from './DailyGameResult';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StatGuessGameProps {
    gameId: string;
    maxGuesses: number;
    clues?: { description?: string; hint?: string; player?: string; category?: string };
    initialGuesses?: string[];
    isCompleted?: boolean;
    targetValue?: string;
    gameNumber: number;
}

interface StatGuess {
    value: string;
    direction: 'correct' | 'higher' | 'lower';
}

export function StatGuessGame({
    gameId,
    maxGuesses,
    clues,
    initialGuesses = [],
    isCompleted = false,
    targetValue,
    gameNumber,
}: StatGuessGameProps) {
    const [guesses, setGuesses] = useState<StatGuess[]>([]);
    const [currentGuess, setCurrentGuess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gameOver, setGameOver] = useState(isCompleted);
    const [won, setWon] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!currentGuess.trim() || isSubmitting) return;

        const numValue = parseFloat(currentGuess);
        if (isNaN(numValue)) {
            toast({
                title: 'Invalid number',
                description: 'Please enter a valid number',
                variant: 'destructive',
            });
            return;
        }

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

            const newGuess: StatGuess = {
                value: currentGuess,
                direction: data.feedback?.direction || 'wrong',
            };

            setGuesses(prev => [...prev, newGuess]);
            setCurrentGuess('');

            if (data.isCorrect || data.gameOver) {
                setGameOver(true);
                setWon(data.isCorrect);
                setTimeout(() => setShowResult(true), 500);
            }

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

    const remainingGuesses = maxGuesses - guesses.length;

    return (
        <div className="flex flex-col items-center gap-8 py-4 w-full max-w-md mx-auto px-4">
            {/* Question Card */}
            <motion.div
                className="w-full p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-start gap-3 mb-4">
                    <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                        <h2 className="text-lg font-semibold mb-1">
                            {clues?.description || 'Guess the Stat'}
                        </h2>
                        {clues?.hint && (
                            <p className="text-sm text-muted-foreground">{clues.hint}</p>
                        )}
                        {clues?.player && (
                            <p className="text-sm font-medium text-primary mt-2">
                                Player: {clues.player}
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Previous Guesses */}
            <div className="w-full space-y-3">
                <AnimatePresence>
                    {guesses.map((guess, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                                'flex items-center justify-between p-4 rounded-xl',
                                guess.direction === 'correct' && 'bg-emerald-500/20 border border-emerald-500/30',
                                guess.direction === 'higher' && 'bg-amber-500/20 border border-amber-500/30',
                                guess.direction === 'lower' && 'bg-amber-500/20 border border-amber-500/30',
                            )}
                        >
                            <span className="text-xl font-bold">{guess.value}</span>
                            <div className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-full font-medium',
                                guess.direction === 'correct' && 'bg-emerald-500 text-white',
                                guess.direction === 'higher' && 'bg-amber-500 text-white',
                                guess.direction === 'lower' && 'bg-amber-500 text-white',
                            )}>
                                {guess.direction === 'correct' ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Correct!
                                    </>
                                ) : guess.direction === 'higher' ? (
                                    <>
                                        <ArrowUp className="w-4 h-4" />
                                        Higher
                                    </>
                                ) : (
                                    <>
                                        <ArrowDown className="w-4 h-4" />
                                        Lower
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Input */}
            {!gameOver && (
                <div className="w-full space-y-4">
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="Enter your guess..."
                            value={currentGuess}
                            onChange={(e) => setCurrentGuess(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            className="text-center text-xl font-bold h-14"
                            disabled={isSubmitting}
                        />
                        <Button
                            onClick={handleSubmit}
                            disabled={!currentGuess.trim() || isSubmitting}
                            className="h-14 px-6"
                        >
                            Guess
                        </Button>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                        {remainingGuesses} guesses remaining
                    </p>
                </div>
            )}

            {/* Game Over */}
            {gameOver && !won && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-4 bg-muted rounded-xl"
                >
                    <p className="text-lg">The answer was <span className="font-bold text-primary">{targetValue}</span></p>
                </motion.div>
            )}

            {/* Result Modal */}
            <AnimatePresence>
                {showResult && (
                    <DailyGameResult
                        won={won}
                        guesses={[]} // Simplified for stat mode
                        maxGuesses={maxGuesses}
                        gameNumber={gameNumber}
                        targetWord={targetValue}
                        onClose={() => setShowResult(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
