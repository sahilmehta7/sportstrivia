'use client';

import { DailyGameType } from '@/lib/utils/daily-game-logic';
import { DailyGameBoard } from '@/components/daily';

interface DailyGameClientProps {
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

export function DailyGameClient(props: DailyGameClientProps) {
    return <DailyGameBoard {...props} />;
}
