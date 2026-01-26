'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowUp, ArrowDown, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DailyGameResult } from './DailyGameResult';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { DailyGameType } from '@/lib/utils/daily-game-logic';

interface AthleteGuessGameProps {
    gameId: string;
    maxGuesses: number;
    clues?: Record<string, unknown>;
    initialGuesses?: string[];
    isCompleted?: boolean;
    targetValue?: string;
    gameNumber: number;
    gameType: DailyGameType;
}

interface GuessResult {
    name: string;
    attributes: {
        key: string;
        value: string | number;
        status: 'match' | 'higher' | 'lower' | 'wrong';
    }[];
}

// Attributes to display for comparison
const DISPLAY_ATTRIBUTES = ['team', 'league', 'position', 'age', 'number', 'conference'];

export function AthleteGuessGame({
    gameId,
    maxGuesses,
    clues,
    initialGuesses = [],
    isCompleted = false,
    targetValue,
    gameNumber,
    gameType,
}: AthleteGuessGameProps) {
    const [guesses, setGuesses] = useState<GuessResult[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gameOver, setGameOver] = useState(isCompleted);
    const [won, setWon] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!searchQuery.trim() || isSubmitting) return;

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/daily/guess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gameId, guess: searchQuery }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to submit guess');
            }

            // Build attributes comparison from clues
            const attributes: GuessResult['attributes'] = [];
            if (clues) {
                DISPLAY_ATTRIBUTES.forEach(key => {
                    if (clues[key] !== undefined) {
                        // Mock comparison - in real app, this would come from the API
                        const targetVal = clues[key];
                        const guessedVal = targetVal; // Simplified for now

                        let status: 'match' | 'higher' | 'lower' | 'wrong' = 'wrong';
                        if (data.isCorrect) {
                            status = 'match';
                        } else if (typeof targetVal === 'number') {
                            status = Math.random() > 0.5 ? 'higher' : 'lower';
                        }

                        attributes.push({
                            key,
                            value: guessedVal as string | number,
                            status,
                        });
                    }
                });
            }

            const newGuess: GuessResult = {
                name: searchQuery.toUpperCase(),
                attributes,
            };

            setGuesses(prev => [...prev, newGuess]);
            setSearchQuery('');

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
        <div className="flex flex-col items-center gap-6 py-4 w-full max-w-2xl mx-auto px-4">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-lg font-semibold text-muted-foreground mb-1">
                    Guess the {gameType === 'ATHLETE' ? 'Athlete' : 'Team'}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {remainingGuesses} guesses remaining
                </p>
            </div>

            {/* Search Input */}
            {!gameOver && (
                <div className="flex gap-2 w-full max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder={`Search ${gameType === 'ATHLETE' ? 'athlete' : 'team'} name...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            className="pl-10"
                            disabled={isSubmitting}
                        />
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={!searchQuery.trim() || isSubmitting}
                    >
                        Guess
                    </Button>
                </div>
            )}

            {/* Guesses Table */}
            {guesses.length > 0 && (
                <motion.div
                    className="w-full overflow-x-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-2 px-3 font-medium text-sm">Name</th>
                                {DISPLAY_ATTRIBUTES.map(attr => (
                                    <th key={attr} className="text-center py-2 px-2 font-medium text-sm capitalize">
                                        {attr}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {guesses.map((guess, i) => (
                                    <motion.tr
                                        key={i}
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="border-b border-border/50"
                                    >
                                        <td className="py-3 px-3 font-medium">{guess.name}</td>
                                        {guess.attributes.map((attr, j) => (
                                            <td key={j} className="py-2 px-2 text-center">
                                                <div
                                                    className={cn(
                                                        'inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-sm font-medium',
                                                        attr.status === 'match' && 'bg-emerald-500 text-white',
                                                        attr.status === 'higher' && 'bg-amber-500 text-white',
                                                        attr.status === 'lower' && 'bg-amber-500 text-white',
                                                        attr.status === 'wrong' && 'bg-zinc-200 dark:bg-zinc-700'
                                                    )}
                                                >
                                                    {attr.value}
                                                    {attr.status === 'match' && <Check className="w-3 h-3" />}
                                                    {attr.status === 'higher' && <ArrowUp className="w-3 h-3" />}
                                                    {attr.status === 'lower' && <ArrowDown className="w-3 h-3" />}
                                                    {attr.status === 'wrong' && <X className="w-3 h-3" />}
                                                </div>
                                            </td>
                                        ))}
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </motion.div>
            )}

            {/* Result Modal */}
            <AnimatePresence>
                {showResult && (
                    <DailyGameResult
                        won={won}
                        guesses={[]} // Simplified for athlete mode
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
