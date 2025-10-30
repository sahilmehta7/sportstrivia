import { computeQuizScale } from '@/lib/scoring/computeQuizScale';

describe('computeQuizScale', () => {
  it('computes scale as completionBonus / sumWeights', () => {
    const scale = computeQuizScale({
      completionBonus: 1000,
      questions: [
        { difficulty: 'EASY' },
        { difficulty: 'MEDIUM' },
        { difficulty: 'HARD' },
      ],
    });
    // weights: 1 + 2 + 3 = 6 -> 1000 / 6 ≈ 166.666...
    expect(scale).toBeCloseTo(1000 / 6, 5);
  });
});


