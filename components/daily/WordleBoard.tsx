'use client';

import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import type { LetterResult, LetterStatus } from '@/lib/utils/daily-game-logic';

interface WordleTileProps {
    letter?: string;
    status?: LetterStatus;
    isRevealing?: boolean;
    delay?: number;
    tileSizeStyle?: CSSProperties;
}

function WordleTile({ letter, status, isRevealing, delay = 0, tileSizeStyle }: WordleTileProps) {
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
                'flex items-center justify-center border-2',
                "font-['Barlow_Condensed',sans-serif] font-bold uppercase tracking-tight",
                'h-[var(--tile-size)] w-[var(--tile-size)] text-[clamp(1rem,calc(var(--tile-size)*0.5),1.9rem)]',
                baseStyles,
                status && statusStyles[status]
            )}
            style={tileSizeStyle}
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

    // Keep long words visible on small screens by shrinking tiles to fit.
    const rowGapPx = 4;
    const boardPaddingPx = 32;
    const minTilePx = 26;
    const maxTilePx = 64;
    const calculatedTileSize = `clamp(${minTilePx}px, calc((100vw - ${boardPaddingPx}px - ${(wordLength - 1) * rowGapPx}px) / ${wordLength}), ${maxTilePx}px)`;
    const tileSizeStyle = { '--tile-size': calculatedTileSize } as CSSProperties;

    // Completed guesses
    for (let i = 0; i < guesses.length; i++) {
        const guess = guesses[i];
        const isLatestGuess = i === guesses.length - 1;

        rows.push(
            <div key={`guess-${i}`} className="flex w-max gap-1">
                {guess.map((result, j) => (
                    <WordleTile
                        key={j}
                        letter={result.letter}
                        status={result.status}
                        isRevealing={isLatestGuess && isRevealing}
                        delay={j * 0.08}
                        tileSizeStyle={tileSizeStyle}
                    />
                ))}
            </div>
        );
    }

    // Current guess row
    if (guesses.length < maxGuesses) {
        const currentLetters = currentGuess.split('');
        rows.push(
            <div key="current" className="flex w-max gap-1">
                {Array.from({ length: wordLength }).map((_, i) => (
                    <motion.div
                        key={i}
                        initial={currentLetters[i] ? { scale: 0.9 } : undefined}
                        animate={currentLetters[i] ? { scale: 1 } : undefined}
                        transition={{ type: 'spring', stiffness: 600, damping: 35 }}
                    >
                        <WordleTile letter={currentLetters[i]} tileSizeStyle={tileSizeStyle} />
                    </motion.div>
                ))}
            </div>
        );
    }

    // Empty rows
    for (let i = guesses.length + 1; i < maxGuesses; i++) {
        rows.push(
            <div key={`empty-${i}`} className="flex w-max gap-1">
                {Array.from({ length: wordLength }).map((_, j) => (
                    <WordleTile key={j} tileSizeStyle={tileSizeStyle} />
                ))}
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto pb-1">
            <div className="mx-auto flex w-fit max-w-full flex-col items-center gap-1 [--tile-size:56px]">
                {rows}
            </div>
        </div>
    );
}
