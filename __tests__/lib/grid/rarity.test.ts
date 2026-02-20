import { computeRarity, computeRarityBonus, computePickedByPercentage } from '@/lib/grid/rarity';
import { computeGridCellScore } from '@/lib/grid/grid-scoring';

describe('computeRarity', () => {
    it('returns 0 for the only answer (all picks)', () => {
        // answerCorrectCount=10, totalCorrect=10, K=1
        const rarity = computeRarity(10, 10, 1);
        expect(rarity).toBe(0);
    });

    it('returns high value for rare answers', () => {
        // 1 pick out of 100 total, K=10
        const rarity = computeRarity(1, 100, 10);
        expect(rarity).toBeGreaterThan(0.95 - 0.01); // close to max
    });

    it('clamps at 0.95', () => {
        const rarity = computeRarity(0, 1000, 10);
        expect(rarity).toBeLessThanOrEqual(0.95);
    });

    it('clamps at 0 for negative edge cases', () => {
        const rarity = computeRarity(100, 1, 0);
        expect(rarity).toBeGreaterThanOrEqual(0);
    });

    it('handles zero total correct with smoothing', () => {
        const rarity = computeRarity(0, 0, 10);
        expect(rarity).toBeGreaterThan(0.8); // 1 - (1/10) = 0.9
        expect(rarity).toBeLessThanOrEqual(0.95);
    });
});

describe('computeRarityBonus', () => {
    it('returns 0 when rarity is 0', () => {
        expect(computeRarityBonus(100, 1.0, 0)).toBe(0);
    });

    it('returns correct bonus for standard rarity', () => {
        expect(computeRarityBonus(100, 1.0, 0.5)).toBe(50);
    });

    it('respects weight multiplier', () => {
        expect(computeRarityBonus(100, 2.0, 0.5)).toBe(100);
    });

    it('rounds to nearest integer', () => {
        expect(computeRarityBonus(100, 1.0, 0.33)).toBe(33);
    });
});

describe('computePickedByPercentage', () => {
    it('returns 100 when totalCorrect is 0 (first pick)', () => {
        expect(computePickedByPercentage(0, 0)).toBe(100);
    });

    it('returns correct percentage', () => {
        expect(computePickedByPercentage(25, 100)).toBe(25);
    });

    it('rounds to integer', () => {
        expect(computePickedByPercentage(1, 3)).toBe(33);
    });
});

describe('computeGridCellScore', () => {
    it('computes full score correctly', () => {
        const result = computeGridCellScore({
            basePoints: 100,
            rarityWeight: 1.0,
            answerCorrectCount: 5,
            totalCorrect: 100,
            K: 10,
        });

        expect(result.basePoints).toBe(100);
        expect(result.totalPoints).toBe(result.basePoints + result.rarityBonus);
        expect(result.totalPoints).toBeGreaterThan(100); // has rarity bonus
        expect(result.rarity).toBeGreaterThan(0);
        expect(result.pickedByPercent).toBe(5);
    });

    it('has lower bonus for common answers', () => {
        const rare = computeGridCellScore({
            basePoints: 100,
            rarityWeight: 1.0,
            answerCorrectCount: 1,
            totalCorrect: 100,
            K: 10,
        });

        const common = computeGridCellScore({
            basePoints: 100,
            rarityWeight: 1.0,
            answerCorrectCount: 50,
            totalCorrect: 100,
            K: 10,
        });

        expect(rare.rarityBonus).toBeGreaterThan(common.rarityBonus);
    });
});
