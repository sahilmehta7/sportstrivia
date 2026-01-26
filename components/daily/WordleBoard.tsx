'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { LetterResult, LetterStatus } from '@/lib/utils/daily-game-logic';

interface WordleTileProps {
    letter?: string;
    status?: LetterStatus;
    isRevealing?: boolean;
    delay?: number;
}

function WordleTile({ letter, status, isRevealing, delay = 0 }: WordleTileProps) {
    // Minimalist athletic color scheme
    const statusStyles: Record<LetterStatus, string> = {
        correct: 'bg-accent text-accent-foreground border-accent',
        present: 'bg-warning/20 text-warning border-warning',
        absent: 'bg-muted text-muted-foreground border-muted',
    };

    const baseStyles = letter && !status
        ? 'border-foreground/30 text-foreground'
        : 'border-border';

    return (
        <motion.div
            className={cn(
                'w-14 h-14 sm:w-16 sm:h-16 border-2 flex items-center justify-center',
                "text-2xl sm:text-3xl font-bold uppercase font-['Barlow_Condensed',sans-serif] tracking-tight",
                baseStyles,
                status && statusStyles[status]
            )}
            initial={isRevealing ? { rotateX: 0 } : undefined}
            animate={isRevealing ? { rotateX: 360 } : undefined}
            transition={{
                duration: 0.4,
                delay,
                type: 'tween'
            }}
        >
            {letter}
        </motion.div>
    );
}

interface WordleBoardProps {
    guesses: LetterResult[][];
    currentGuess: string;
    maxGuesses?: number;
    wordLength?: number;
    isRevealing?: boolean;
}

export function WordleBoard({
    guesses,
    currentGuess,
    maxGuesses = 6,
    wordLength = 5,
    isRevealing = false,
}: WordleBoardProps) {
    const rows = [];

    // Completed guesses
    for (let i = 0; i < guesses.length; i++) {
        const guess = guesses[i];
        const isLatestGuess = i === guesses.length - 1;

        rows.push(
            <div key={`guess-${i}`} className="flex gap-1">
                {guess.map((result, j) => (
                    <WordleTile
                        key={j}
                        letter={result.letter}
                        status={result.status}
                        isRevealing={isLatestGuess && isRevealing}
                        delay={j * 0.08}
                    />
                ))}
            </div>
        );
    }

    // Current guess row
    if (guesses.length < maxGuesses) {
        const currentLetters = currentGuess.split('');
        rows.push(
            <div key="current" className="flex gap-1">
                {Array.from({ length: wordLength }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={currentLetters[i] ? { scale: 0.9 } : undefined}
                        animate={currentLetters[i] ? { scale: 1 } : undefined}
                        transition={{ type: 'spring', stiffness: 600, damping: 35 }}
                    >
                        <WordleTile letter={currentLetters[i]} />
                    </motion.div>
                ))}
            </div>
        );
    }

    // Empty rows
    for (let i = guesses.length + 1; i < maxGuesses; i++) {
        rows.push(
            <div key={`empty-${i}`} className="flex gap-1">
                {Array.from({ length: wordLength }).map((_, j) => (
                    <WordleTile key={j} />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-1">
            {rows}
        </div>
    );
}
