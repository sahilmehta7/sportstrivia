"use client";

import { useState, Fragment, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface GridBuilderData {
    rows: string[];
    cols: string[];
    cellAnswers: string[][]; // cellAnswers[rowIndex][colIndex] = newline-separated accepted answers
}

interface GridBuilderProps {
    initialData?: Partial<GridBuilderData>;
    onChange: (data: GridBuilderData) => void;
}

const DEFAULT_DATA: GridBuilderData = {
    rows: ["", "", ""],
    cols: ["", "", ""],
    cellAnswers: [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
    ],
};

export function GridBuilder({ initialData, onChange }: GridBuilderProps) {
    const [data, setData] = useState<GridBuilderData>(() => {
        return {
            rows: initialData?.rows || DEFAULT_DATA.rows,
            cols: initialData?.cols || DEFAULT_DATA.cols,
            cellAnswers: initialData?.cellAnswers || DEFAULT_DATA.cellAnswers,
        };
    });

    // Notify parent of changes
    useEffect(() => {
        onChange(data);
    }, [data, onChange]);

    const update = (updated: GridBuilderData) => {
        setData(updated);
    };

    const setRow = (index: number, value: string) => {
        const rows = [...data.rows];
        rows[index] = value;
        update({ ...data, rows });
    };

    const setCol = (index: number, value: string) => {
        const cols = [...data.cols];
        cols[index] = value;
        update({ ...data, cols });
    };

    const setCell = (row: number, col: number, value: string) => {
        const cellAnswers = data.cellAnswers.map((r) => [...r]);
        cellAnswers[row][col] = value;
        update({ ...data, cellAnswers });
    };

    return (
        <Card className="rounded-sm border-border">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider">
                    Grid Builder — 3×3
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Column labels */}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                        Column Labels
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {data.cols.map((col, i) => (
                            <Input
                                key={`col-${i}`}
                                placeholder={`Column ${i + 1}`}
                                value={col}
                                onChange={(e) => setCol(i, e.target.value)}
                                className="rounded-sm text-sm"
                            />
                        ))}
                    </div>
                </div>

                {/* Row labels */}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                        Row Labels
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {data.rows.map((row, i) => (
                            <Input
                                key={`row-${i}`}
                                placeholder={`Row ${i + 1}`}
                                value={row}
                                onChange={(e) => setRow(i, e.target.value)}
                                className="rounded-sm text-sm"
                            />
                        ))}
                    </div>
                </div>

                {/* Cell accepted answers */}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                        Accepted Answers Per Cell (one per line)
                    </label>

                    {/* Visual 4×4 grid */}
                    <div className="grid grid-cols-4 gap-1.5">
                        {/* Corner */}
                        <div className="flex items-center justify-center min-h-[40px] bg-muted/30 rounded-sm">
                            <span className="text-[10px] text-muted-foreground/50">×</span>
                        </div>

                        {/* Col headers */}
                        {data.cols.map((col, i) => (
                            <div
                                key={`hdr-col-${i}`}
                                className="flex items-center justify-center min-h-[40px] bg-primary/10 rounded-sm px-1"
                            >
                                <span className="text-[10px] font-bold text-primary uppercase text-center truncate">
                                    {col || `Col ${i + 1}`}
                                </span>
                            </div>
                        ))}

                        {/* Rows */}
                        {data.rows.map((row, ri) => (
                            <Fragment key={`row-${ri}`}>
                                {/* Row header */}
                                <div
                                    key={`hdr-row-${ri}`}
                                    className="flex items-center justify-center min-h-[40px] bg-primary/10 rounded-sm px-1"
                                >
                                    <span className="text-[10px] font-bold text-primary uppercase text-center truncate">
                                        {row || `Row ${ri + 1}`}
                                    </span>
                                </div>

                                {/* Cells */}
                                {data.cols.map((_, ci) => (
                                    <Textarea
                                        key={`cell-${ri}-${ci}`}
                                        placeholder={`${row || `R${ri + 1}`} × ${data.cols[ci] || `C${ci + 1}`}\n(one name per line)`}
                                        value={data.cellAnswers[ri]?.[ci] || ""}
                                        onChange={(e) => setCell(ri, ci, e.target.value)}
                                        className={cn(
                                            "rounded-sm text-xs min-h-[80px] resize-none",
                                            "border-border",
                                            (data.cellAnswers[ri]?.[ci] || "").trim().length > 0 && "border-success/40 bg-success/5"
                                        )}
                                    />
                                ))}
                            </Fragment>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
