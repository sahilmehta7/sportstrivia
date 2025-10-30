import { scoringConfig, normalizeDifficultyKey } from '@/lib/config/scoring';

export function computeQuestionScore(params: {
  isCorrect: boolean;
  responseTimeSeconds: number;
  timeLimitSeconds: number | null | undefined;
  difficulty: string;
  quizScale: number; // precomputed as completionBonus / sumWeights
}): number {
  const { isCorrect, responseTimeSeconds, timeLimitSeconds, difficulty, quizScale } = params;
  if (!isCorrect) return 0;
  const Lraw = timeLimitSeconds ?? scoringConfig.minTimeLimitSeconds;
  const L = Math.max(Lraw, scoringConfig.minTimeLimitSeconds);
  const t = Math.max(0, Number.isFinite(responseTimeSeconds) ? responseTimeSeconds : 0);
  if (!Number.isFinite(quizScale) || quizScale <= 0) return 0;
  if (t > L) return 0;

  const key = normalizeDifficultyKey(difficulty);
  const difficultyWeight = scoringConfig.difficultyWeights[key] ?? 0;
  if (difficultyWeight <= 0) return 0;
  const weight = difficultyWeight * L;
  if (weight <= 0) return 0;

  const pMax = quizScale * weight;
  const timeFactor = Math.pow(1 - t / L, 2);
  const factor = scoringConfig.floorPortion + (1 - scoringConfig.floorPortion) * timeFactor;
  return Math.round(pMax * factor);
}
