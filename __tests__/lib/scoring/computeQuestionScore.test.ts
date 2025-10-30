import { computeQuestionScore } from '@/lib/scoring/computeQuestionScore';

describe('computeQuestionScore', () => {
  it('returns 0 when incorrect or out of time', () => {
    expect(
      computeQuestionScore({
        isCorrect: false,
        responseTimeSeconds: 0,
        timeLimitSeconds: 10,
        difficulty: 'EASY',
        quizScale: 10,
      })
    ).toBe(0);

    expect(
      computeQuestionScore({
        isCorrect: true,
        responseTimeSeconds: 10,
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
      quizScale: 10, // pMax easy = 10 * 1 = 10
    });
    const fastHard = computeQuestionScore({
      isCorrect: true,
      responseTimeSeconds: 0,
      timeLimitSeconds: 20,
      difficulty: 'HARD',
      quizScale: 10, // pMax hard = 10 * 3 = 30
    });
    expect(fastHard).toBeGreaterThan(fastEasy);

    const slowEasy = computeQuestionScore({
      isCorrect: true,
      responseTimeSeconds: 19,
      timeLimitSeconds: 20,
      difficulty: 'EASY',
      quizScale: 10,
    });
    expect(slowEasy).toBeGreaterThan(0);
    expect(slowEasy).toBeLessThan(fastEasy);
  });
});


