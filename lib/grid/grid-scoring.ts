/**
 * Grid cell scoring orchestrator.
 *
 * Combines base points with rarity bonus for a single grid cell.
 */

import { computeRarity, computeRarityBonus, computePickedByPercentage } from "./rarity";

export interface GridCellScoreInput {
    basePoints: number;
    rarityWeight: number;
    answerCorrectCount: number;
    totalCorrect: number;
    K: number; // smoothing constant
}

export interface GridCellScoreResult {
    basePoints: number;
    rarity: number;
    rarityBonus: number;
    totalPoints: number;
    pickedByPercent: number;
}

/**
 * Compute the full score for a correct grid cell answer.
 */
export function computeGridCellScore(input: GridCellScoreInput): GridCellScoreResult {
    const { basePoints, rarityWeight, answerCorrectCount, totalCorrect, K } = input;

    const rarity = computeRarity(answerCorrectCount, totalCorrect, K);
    const rarityBonus = computeRarityBonus(basePoints, rarityWeight, rarity);
    const totalPoints = basePoints + rarityBonus;
    const pickedByPercent = computePickedByPercentage(answerCorrectCount, totalCorrect);

    return {
        basePoints,
        rarity,
        rarityBonus,
        totalPoints,
        pickedByPercent,
    };
}

/** Default grid scoring configuration. */
export const DEFAULT_GRID_SCORING = {
    basePointsPerCell: 100,
    rarityWeight: 1.0,
} as const;

/** Default answer matching configuration. */
export const DEFAULT_ANSWER_MATCHING = {
    fuzzyThreshold: 0.9,
    minLength: 3,
} as const;

/** Parse playConfig JSON and extract grid scoring config with defaults. */
export function getGridScoringConfig(playConfig: unknown): {
    basePointsPerCell: number;
    rarityWeight: number;
    fuzzyThreshold: number;
    minLength: number;
    rows: string[];
    cols: string[];
} {
    const config = (playConfig ?? {}) as Record<string, unknown>;
    const grid = (config.grid ?? {}) as Record<string, unknown>;
    const scoring = (config.gridScoring ?? {}) as Record<string, unknown>;
    const matching = (config.answerMatching ?? {}) as Record<string, unknown>;

    return {
        rows: Array.isArray(grid.rows) ? (grid.rows as string[]) : [],
        cols: Array.isArray(grid.cols) ? (grid.cols as string[]) : [],
        basePointsPerCell:
            typeof scoring.basePointsPerCell === "number"
                ? scoring.basePointsPerCell
                : DEFAULT_GRID_SCORING.basePointsPerCell,
        rarityWeight:
            typeof scoring.rarityWeight === "number"
                ? scoring.rarityWeight
                : DEFAULT_GRID_SCORING.rarityWeight,
        fuzzyThreshold:
            typeof matching.fuzzyThreshold === "number"
                ? matching.fuzzyThreshold
                : DEFAULT_ANSWER_MATCHING.fuzzyThreshold,
        minLength:
            typeof matching.minLength === "number"
                ? matching.minLength
                : DEFAULT_ANSWER_MATCHING.minLength,
    };
}
