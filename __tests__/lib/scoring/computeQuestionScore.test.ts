import { computeQuestionScore } from '@/lib/scoring/computeQuestionScore';

describe('computeQuestionScore', () => {
  it('returns 0 when incorrect or after time limit', () => {
    expect(
      computeQuestionScore({
        isCorrect: false,
        responseTimeSeconds: 0,
        timeLimitSeconds: 10,
        difficulty: 'EASY',
        quizScale: 10,
      })
    ).toBe(0);

    const buzzerBeater = computeQuestionScore({
      isCorrect: true,
      responseTimeSeconds: 10,
      timeLimitSeconds: 10,
      difficulty: 'EASY',
      quizScale: 10,
    });
    expect(buzzerBeater).toBe(17);
    expect(Number.isInteger(buzzerBeater)).toBe(true);

    expect(
      computeQuestionScore({
        isCorrect: true,
        responseTimeSeconds: 11,
        timeLimitSeconds: 10,
        difficulty: 'EASY',
        quizScale: 10,
      })
    ).toBe(0);
  });

  it('rewards faster answers and scales by difficulty', () => {
    const fastEasy = computeQuestionScore({
      isCorrect: true,
      responseTimeSeconds: 0,
      timeLimitSeconds: 20,
      difficulty: 'EASY',
      quizScale: 10, // pMax easy ≈ 10 * (0.66 * 20) = 132
    });
    expect(Number.isInteger(fastEasy)).toBe(true);
    const fastHard = computeQuestionScore({
      isCorrect: true,
      responseTimeSeconds: 0,
      timeLimitSeconds: 20,
      difficulty: 'HARD',
      quizScale: 10, // pMax hard ≈ 10 * (1.33 * 20) = 266
    });
    expect(fastHard).toBeGreaterThan(fastEasy);
    expect(Number.isInteger(fastHard)).toBe(true);

    const slowEasy = computeQuestionScore({
      isCorrect: true,
      responseTimeSeconds: 19,
      timeLimitSeconds: 20,
      difficulty: 'EASY',
      quizScale: 10,
    });
    expect(slowEasy).toBeGreaterThan(0);
    expect(slowEasy).toBeLessThan(fastEasy);
    expect(Number.isInteger(slowEasy)).toBe(true);
  });
});
