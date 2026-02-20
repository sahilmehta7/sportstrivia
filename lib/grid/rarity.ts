/**
 * Rarity scoring for Immaculate Grid.
 *
 * Rarity is computed from aggregate correct submissions per grid cell question.
 * Uses Laplace smoothing to avoid extreme bonuses on low-volume data.
 */

/**
 * Compute rarity score for an answer.
 *
 * Formula: rarity = 1 - ((answerCorrectCount + 1) / (totalCorrect + K))
 * Clamped to [0, 0.95].
 *
 * @param answerCorrectCount How many times this specific answer was picked correctly
 * @param totalCorrect       Total correct submissions for this question
 * @param K                  Smoothing constant (default: number of accepted answers, or 10)
 */
export function computeRarity(
    answerCorrectCount: number,
    totalCorrect: number,
    K = 10
): number {
    if (totalCorrect + K <= 0) return 0;

    const rarity = 1 - (answerCorrectCount + 1) / (totalCorrect + K);
    return Math.max(0, Math.min(0.95, rarity));
}

/**
 * Compute rarity bonus points.
 *
 * @param basePoints    Base points for the cell (default: 100)
 * @param rarityWeight  Weight multiplier (default: 1.0)
 * @param rarity        Rarity score [0, 0.95]
 */
export function computeRarityBonus(
    basePoints: number,
    rarityWeight: number,
    rarity: number
): number {
    return Math.round(basePoints * rarityWeight * rarity);
}

/**
 * Compute "Picked by X%" display value.
 *
 * @param answerCorrectCount How many times this answer was picked
 * @param totalCorrect       Total correct submissions
 */
export function computePickedByPercentage(
    answerCorrectCount: number,
    totalCorrect: number
): number {
    if (totalCorrect <= 0) return 100; // first correct answer = 100%
    return Math.round((answerCorrectCount / totalCorrect) * 100);
}
