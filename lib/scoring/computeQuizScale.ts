import { scoringConfig, normalizeDifficultyKey } from '@/lib/config/scoring';

export type QuestionLike = { difficulty: string; timeLimitSeconds?: number | null };

export function computeQuizScale(params: {
  completionBonus: number;
  questions: QuestionLike[];
}): number {
  const { completionBonus, questions } = params;
  if (!Number.isFinite(completionBonus) || completionBonus <= 0) return 0;
  const sumWeights = questions.reduce((sum, q) => {
    const key = normalizeDifficultyKey(q.difficulty);
    const difficultyWeight = scoringConfig.difficultyWeights[key] ?? 0;
    if (difficultyWeight <= 0) return sum;
    const rawLimit = Number.isFinite(q.timeLimitSeconds) ? Number(q.timeLimitSeconds) : 0;
    const sanitizedLimit = Math.max(rawLimit, scoringConfig.minTimeLimitSeconds);
    return sum + difficultyWeight * sanitizedLimit;
  }, 0);
  if (sumWeights <= 0) return 0;
  return completionBonus / sumWeights;
}
