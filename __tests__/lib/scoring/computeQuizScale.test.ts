import { computeQuizScale } from '@/lib/scoring/computeQuizScale';

describe('computeQuizScale', () => {
  it('computes scale as completionBonus / sumWeights', () => {
    const scale = computeQuizScale({
      completionBonus: 1000,
      questions: [
        { difficulty: 'EASY', timeLimitSeconds: 60 },
        { difficulty: 'MEDIUM', timeLimitSeconds: 60 },
        { difficulty: 'HARD', timeLimitSeconds: 60 },
      ],
    });
    // weights: (0.66 + 1 + 1.33) * 60 = 179.4
    expect(scale).toBeCloseTo(1000 / 179.4, 5);
  });

  it('weights questions by difficulty and time limit', () => {
    const scale = computeQuizScale({
      completionBonus: 600,
      questions: [
        { difficulty: 'EASY', timeLimitSeconds: 30 }, // weight 0.66 * 30 = 19.8
        { difficulty: 'HARD', timeLimitSeconds: 90 }, // weight 1.33 * 90 = 119.7
      ],
    });
    // sum weights = 139.5 -> scale = 600 / 139.5 ≈ 4.301075
    expect(scale).toBeCloseTo(600 / 139.5, 5);
  });
});
