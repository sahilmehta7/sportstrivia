'use client';

import { motion } from 'framer-motion';
import { X, Share2, Trophy, Frown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateShareableGrid, type LetterResult } from '@/lib/utils/daily-game-logic';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getGradientText, getChipStyles } from '@/lib/showcase-theme';

interface DailyGameResultProps {
    won: boolean;
    guesses: LetterResult[][];
    maxGuesses: number;
    gameNumber: number;
    targetWord?: string;
    onClose: () => void;
}

export function DailyGameResult({
    won,
    guesses,
    maxGuesses,
    gameNumber,
    targetWord,
    onClose,
}: DailyGameResultProps) {
    const { toast } = useToast();

    const handleShare = async () => {
        const shareText = generateShareableGrid(gameNumber, guesses, won, maxGuesses);

        try {
            if (navigator.share) {
                await navigator.share({ text: shareText });
            } else {
                await navigator.clipboard.writeText(shareText);
                toast({
                    title: 'Copied to clipboard!',
                    description: 'Share your results with friends',
                });
            }
        } catch {
            // User cancelled share
        }
    };

    // Calculate XP earned
    const xpEarned = won ? 50 + Math.max(0, (maxGuesses - guesses.length) * 10) : 0;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                className="relative w-full max-w-sm bg-card border border-border shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Accent bar */}
                <div className={cn(
                    'absolute top-0 left-0 right-0 h-1',
                    won ? 'bg-accent' : 'bg-muted-foreground'
                )} />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 border border-border hover:bg-muted transition-colors z-10"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="pt-10 pb-6 px-6 text-center border-b border-border">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                        className={cn(
                            'inline-flex items-center justify-center w-16 h-16 border-2 mb-4',
                            won ? 'border-accent bg-accent/10' : 'border-border bg-muted'
                        )}
                    >
                        {won ? (
                            <Trophy className="w-8 h-8 text-accent" />
                        ) : (
                            <Frown className="w-8 h-8 text-muted-foreground" />
                        )}
                    </motion.div>

                    <h2 className={cn(
                        "text-3xl font-bold uppercase tracking-tighter font-['Barlow_Condensed',sans-serif] mb-2",
                        won ? getGradientText('accent') : 'text-foreground'
                    )}>
                        {won ? 'VICTORY' : 'GAME OVER'}
                    </h2>

                    {won ? (
                        <p className="text-muted-foreground uppercase text-sm tracking-wide">
                            Solved in {guesses.length}/{maxGuesses} attempts
                        </p>
                    ) : (
                        <p className="text-muted-foreground">
                            The answer was <span className="font-bold text-foreground font-mono">{targetWord}</span>
                        </p>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* XP Earned */}
                    {won && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center justify-center gap-2 p-4 border border-accent/30 bg-accent/5"
                        >
                            <Sparkles className="w-5 h-5 text-accent" />
                            <span className="text-lg font-bold uppercase tracking-wide text-accent">
                                +{xpEarned} XP
                            </span>
                        </motion.div>
                    )}

                    {/* Mini grid preview */}
                    <div className="flex justify-center gap-0.5">
                        {guesses.map((guess, i) => (
                            <div key={i} className="flex flex-col gap-0.5">
                                {guess.map((letter, j) => (
                                    <div
                                        key={j}
                                        className={cn(
                                            'w-4 h-4',
                                            letter.status === 'correct' ? 'bg-accent' :
                                                letter.status === 'present' ? 'bg-warning' :
                                                    'bg-muted'
                                        )}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Share Button */}
                    <Button
                        onClick={handleShare}
                        className={cn(
                            "w-full h-12 font-bold uppercase tracking-widest text-sm gap-2",
                            won ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                        )}
                    >
                        <Share2 className="w-4 h-4" />
                        Share Results
                    </Button>

                    {/* Countdown notice */}
                    <p className="text-center text-xs text-muted-foreground uppercase tracking-wide">
                        New challenge at midnight IST
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}
