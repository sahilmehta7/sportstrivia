'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trophy, Medal, User, Flag, Calendar, Hash, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    isCorrect: boolean;
}

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
    const [solution, setSolution] = useState(targetValue);
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

            const newGuess: GuessResult = {
                name: searchQuery.toUpperCase(),
                isCorrect: data.isCorrect,
            };

            setGuesses(prev => [newGuess, ...prev]);
            setSearchQuery('');

            if (data.isCorrect || data.gameOver) {
                setGameOver(true);
                setWon(data.isCorrect);
                if (data.solution) {
                    setSolution(data.solution);
                }
                setTimeout(() => setShowResult(true), 1500);
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

    // Helper to format clue keys
    const formatClueKey = (key: string) => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase());
    };

    // Helper to get icon for clue key
    const getClueIcon = (key: string) => {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('sport')) return <Medal className="w-4 h-4" />;
        if (lowerKey.includes('team')) return <Flag className="w-4 h-4" />;
        if (lowerKey.includes('age')) return <Calendar className="w-4 h-4" />;
        if (lowerKey.includes('number')) return <Hash className="w-4 h-4" />;
        if (lowerKey.includes('cham') || lowerKey.includes('award') || lowerKey.includes('slam')) return <Trophy className="w-4 h-4" />;
        return <User className="w-4 h-4" />;
    };

    return (
        <div className="flex flex-col items-center gap-8 py-6 w-full max-w-2xl mx-auto px-4">
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">
                    Guess the {gameType === 'ATHLETE' ? 'Athlete' : 'Team'}
                </h2>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <span className={cn(
                        "font-medium",
                        remainingGuesses <= 2 ? "text-red-500" : "text-emerald-500"
                    )}>
                        {remainingGuesses} attempts remaining
                    </span>
                </div>
            </div>

            {/* Profile Card */}
            <Card className="w-full bg-card/50 backdrop-blur-sm border-primary/20 shadow-lg">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Player Profile
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                    {clues && Object.entries(clues).map(([key, value]) => (
                        <div key={key} className="flex flex-col gap-1 p-3 rounded-lg bg-accent/50 border border-border/50">
                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {getClueIcon(key)}
                                {formatClueKey(key)}
                            </div>
                            <div className="text-sm md:text-base font-bold text-foreground truncate" title={String(value)}>
                                {String(value)}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Search Input */}
            {!gameOver && (
                <div className="w-full max-w-md space-y-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder={`Enter ${gameType === 'ATHLETE' ? 'athlete' : 'team'} name...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                className="pl-10 bg-background/50 border-primary/20 focus-visible:ring-primary/30 h-11"
                                disabled={isSubmitting}
                                autoFocus
                            />
                        </div>
                        <Button
                            onClick={handleSubmit}
                            disabled={!searchQuery.trim() || isSubmitting}
                            className="h-11 px-6 font-semibold"
                            size="lg"
                        >
                            Guess
                        </Button>
                    </div>
                </div>
            )}

            {/* Guesses List */}
            {guesses.length > 0 && (
                <div className="w-full max-w-md space-y-2">
                    <div className="text-sm font-medium text-muted-foreground px-1">
                        Recent Guesses
                    </div>
                    <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                            {guesses.map((guess, i) => (
                                <motion.div
                                    key={`${guess.name}-${i}`}
                                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border shadow-sm backdrop-blur-sm",
                                        guess.isCorrect
                                            ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
                                            : "bg-background/80 border-border text-muted-foreground"
                                    )}
                                >
                                    <span className="font-semibold tracking-wide">{guess.name}</span>
                                    {guess.isCorrect ? (
                                        <Badge variant="outline" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                                            Correct
                                        </Badge>
                                    ) : (
                                        <X className="w-4 h-4 opacity-50" />
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Result Modal */}
            <AnimatePresence>
                {showResult && (
                    <DailyGameResult
                        won={won}
                        guesses={guesses.map(g => ({
                            letter: '',
                            status: g.isCorrect ? 'correct' : 'absent'
                        })) as any} // Keeping compatible with result grid logic
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

