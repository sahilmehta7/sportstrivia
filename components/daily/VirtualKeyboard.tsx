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
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-1 overflow-x-auto px-0.5 sm:max-w-lg sm:px-1">
            {KEYBOARD_ROWS.map((row, rowIndex) => (
                <div key={rowIndex} className="flex w-full justify-center gap-1">
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
                                    'flex h-10 items-center justify-center border-2 transition-colors sm:h-14',
                                    "font-['Barlow_Condensed',sans-serif] text-[11px] font-bold uppercase tracking-wide sm:text-sm",
                                    'flex items-center justify-center',
                                    isSpecial
                                        ? 'min-w-[44px] px-1.5 sm:min-w-[65px] sm:px-4'
                                        : 'w-[8.5vw] max-w-8 min-w-7 sm:w-10',
                                    disabled && 'opacity-50 cursor-not-allowed',
                                    status
                                        ? statusStyles[status]
                                        : 'bg-card border-border text-foreground hover:bg-muted hover:border-foreground/20'
                                )}
                            >
                                {key === 'BACKSPACE' ? (
                                    <Delete className="h-4 w-4 sm:h-5 sm:w-5" />
                                ) : key === 'ENTER' ? (
                                    <CornerDownLeft className="h-4 w-4 sm:h-5 sm:w-5" />
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
