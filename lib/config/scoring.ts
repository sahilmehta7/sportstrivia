export type DifficultyKey = 'EASY' | 'MEDIUM' | 'HARD' | 'easy' | 'medium' | 'hard';

export const scoringConfig = {
  difficultyWeights: {
    easy: 1,
    medium: 2,
    hard: 3,
  },
  floorPortion: 0.25,
  minTimeLimitSeconds: 3,
} as const;

export function normalizeDifficultyKey(difficulty: string): 'easy' | 'medium' | 'hard' {
  const key = difficulty.toLowerCase();
  if (key === 'easy' || key === 'medium' || key === 'hard') return key;
  // Default to medium if unknown
  return 'medium';
}


