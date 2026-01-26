'use client';

import { motion } from 'framer-motion';
import { Delete, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LetterStatus } from '@/lib/utils/daily-game-logic';

const KEYBOARD_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];

interface VirtualKeyboardProps {
    onKeyPress: (key: string) => void;
    letterStatuses: Record<string, LetterStatus>;
    disabled?: boolean;
}

export function VirtualKeyboard({ onKeyPress, letterStatuses, disabled }: VirtualKeyboardProps) {
    // Minimalist athletic color scheme
    const statusStyles: Record<LetterStatus, string> = {
        correct: 'bg-accent text-accent-foreground border-accent',
        present: 'bg-warning/20 text-warning border-warning',
        absent: 'bg-muted text-muted-foreground border-muted',
    };

    const handleClick = (key: string) => {
        if (disabled) return;
        onKeyPress(key);
    };

    return (
        <div className="flex flex-col items-center gap-1 w-full max-w-lg mx-auto px-1">
            {KEYBOARD_ROWS.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1 justify-center w-full">
                    {row.map((key) => {
                        const isSpecial = key === 'ENTER' || key === 'BACKSPACE';
                        const status = letterStatuses[key];

                        return (
                            <motion.button
                                key={key}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleClick(key)}
                                disabled={disabled}
                                className={cn(
                                    'h-12 sm:h-14 border-2 transition-colors',
                                    "font-bold text-xs sm:text-sm uppercase tracking-wide font-['Barlow_Condensed',sans-serif]",
                                    'flex items-center justify-center',
                                    isSpecial ? 'px-2 sm:px-4 min-w-[52px] sm:min-w-[65px]' : 'w-8 sm:w-10',
                                    disabled && 'opacity-50 cursor-not-allowed',
                                    status
                                        ? statusStyles[status]
                                        : 'bg-card border-border text-foreground hover:bg-muted hover:border-foreground/20'
                                )}
                            >
                                {key === 'BACKSPACE' ? (
                                    <Delete className="w-5 h-5" />
                                ) : key === 'ENTER' ? (
                                    <CornerDownLeft className="w-5 h-5" />
                                ) : (
                                    key
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}
