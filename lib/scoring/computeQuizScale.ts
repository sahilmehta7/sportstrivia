import { scoringConfig, normalizeDifficultyKey } from '@/lib/config/scoring';

export type QuestionLike = { difficulty: string };

export function computeQuizScale(params: {
  completionBonus: number;
  questions: QuestionLike[];
}): number {
  const { completionBonus, questions } = params;
  if (!Number.isFinite(completionBonus) || completionBonus <= 0) return 0;
  const sumWeights = questions.reduce((sum, q) => {
    const key = normalizeDifficultyKey(q.difficulty);
    const w = scoringConfig.difficultyWeights[key];
    return sum + (w ?? 0);
  }, 0);
  if (sumWeights <= 0) return 0;
  return completionBonus / sumWeights;
}


