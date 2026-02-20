
"use client";

import { cn } from "@/lib/utils";
import { RarityBadge } from "./RarityBadge";
import { Lock, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type CellState = "empty" | "active" | "correct" | "wrong" | "disabled" | "locked";

interface GridCellProps {
    row: number;
    col: number;
    state: CellState;

    // Data for Filled State
    playerName?: string;
    playerImageUrl?: string;
    rarity?: number;
    points?: number;

    // Interactivity
    onClick?: () => void;
    disabled?: boolean;

    className?: string;
}

export function GridCell({
    _row,
    _col,
    state,
    playerName,
    playerImageUrl,
    rarity,
    points,
    onClick,
    disabled,
    className
}: GridCellProps) {

    const isInteractive = (state === "empty" || state === "active") && !disabled;
    const isFilled = state === "correct";
    const isWrong = state === "wrong" || state === "locked";

    return (
        <div
            onClick={isInteractive ? onClick : undefined}
            className={cn(
                "relative aspect-square w-full rounded-xl border transition-all duration-200 overflow-hidden group select-none",
                // Empty State styling
                state === "empty" && "bg-card hover:bg-accent/50 hover:border-primary/50 cursor-pointer shadow-sm",
                // Active/Focused
                state === "active" && "bg-accent border-primary ring-2 ring-primary ring-offset-2 z-10",
                // Wrong/Locked
                isWrong && "bg-muted/50 border-transparent cursor-not-allowed opacity-80 grayscale",
                // Correct (Base)
                isFilled && "bg-emerald-50 border-emerald-200 cursor-default",

                className
            )}
        >
            <AnimatePresence mode="wait">

                {/* IDLE / ACTIVE STATE */}
                {(state === "empty" || state === "active") && (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center text-muted-foreground/30 group-hover:text-primary/70 transition-colors"
                    >
                        <Plus className={cn("w-8 h-8", state === "active" && "scale-110 text-primary")} />
                    </motion.div>
                )}

                {/* LOCKED / WRONG STATE */}
                {isWrong && (
                    <motion.div
                        key="wrong"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground"
                    >
                        <Lock className="w-6 h-6 mb-1 opacity-50" />
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Locked</span>
                    </motion.div>
                )}

                {/* CORRECT STATE */}
                {isFilled && (
                    <motion.div
                        key="correct"
                        initial={{ rotateY: 90, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        className="absolute inset-0 flex flex-col"
                    >
                        {/* Background Image Layer */}
                        {playerImageUrl ? (
                            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90 transition-transform duration-700 hover:scale-105"
                                style={{ backgroundImage: `url(${playerImageUrl})` }}
                            />
                        ) : (
                            // Fallback Pattern if no image
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10" />
                        )}

                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                        {/* Content Layer */}
                        <div className="relative z-10 flex flex-col justify-end h-full p-2 md:p-3 text-white">
                            {/* Top Right: Rarity */}
                            {rarity !== undefined && (
                                <div className="absolute top-2 right-2">
                                    <RarityBadge percentage={rarity} />
                                </div>
                            )}

                            {/* Bottom: Name */}
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold mb-0.5 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Correct
                                </span>
                                <span className="font-bold text-sm md:text-base leading-tight line-clamp-2 text-balance shadow-black drop-shadow-md">
                                    {playerName || "Unknown Player"}
                                </span>
                                {points && (
                                    <span className="text-[10px] text-white/70 font-mono mt-0.5">
                                        +{points} pts
                                    </span>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
