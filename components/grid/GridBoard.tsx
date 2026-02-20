
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { GridCell, CellState } from "./GridCell";

export interface GridStateItem {
    row: number;
    col: number;
    state: CellState;
    playerName?: string;
    playerImageUrl?: string;
    rarity?: number;
    points?: number;
}

interface GridBoardProps {
    rows: string[];
    cols: string[];
    gridState: GridStateItem[][];
    onCellClick: (row: number, col: number) => void;
    className?: string;
}

export function GridBoard({
    rows,
    cols,
    gridState,
    onCellClick,
    className
}: GridBoardProps) {
    return (
        <div className={cn("grid grid-cols-[auto_1fr_1fr_1fr] gap-2 md:gap-3 w-full max-w-2xl mx-auto", className)}>

            {/* Top Left Corner (Empty/Brand) */}
            <div className="flex items-end justify-end p-2 md:p-4">
                {/* Could put a logo here */}
            </div>

            {/* Column Headers */}
            {cols.map((colLabel, i) => (
                <div key={`col-${i}`} className="flex flex-col items-center justify-end p-2 text-center">
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted flex items-center justify-center mb-2 shadow-sm border overflow-hidden">
                        {/* Placeholder for Team Logo - simplified to text for now */}
                        <span className="text-[10px] md:text-xs font-bold leading-none">{colLabel.substring(0, 2)}</span>
                    </div>
                    <span className="text-xs md:text-sm font-bold leading-tight uppercase tracking-tight text-balance">
                        {colLabel}
                    </span>
                </div>
            ))}

            {/* Main Grid Content: Row Header + 3 Cells */}
            {rows.map((rowLabel, r) => (
                <React.Fragment key={`row-${r}`}>
                    {/* Row Header */}
                    <div className="flex flex-col items-end justify-center p-2 text-right">
                        <div className="flex items-center justify-end gap-2 md:gap-3">
                            <span className="text-xs md:text-sm font-bold leading-tight uppercase tracking-tight text-balance max-w-[80px]">
                                {rowLabel}
                            </span>
                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-full bg-muted flex items-center justify-center shadow-sm border overflow-hidden shrink-0">
                                <span className="text-[10px] md:text-xs font-bold leading-none">{rowLabel.substring(0, 2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Cells for this Row */}
                    {gridState[r].map((cell, c) => (
                        <GridCell
                            key={`cell-${r}-${c}`}
                            row={r}
                            col={c}
                            state={cell.state}
                            playerName={cell.playerName}
                            playerImageUrl={cell.playerImageUrl}
                            rarity={cell.rarity}
                            points={cell.points}
                            onClick={() => onCellClick(r, c)}
                        />
                    ))}
                </React.Fragment>
            ))}

        </div>
    );
}
