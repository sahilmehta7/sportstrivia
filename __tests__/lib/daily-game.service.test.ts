jest.mock('@/lib/db', () => {
  const mockPrisma: any = {
    dailyGame: {
      findUnique: jest.fn(),
    },
    dailyGameAttempt: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  return { prisma: mockPrisma };
});

import { prisma } from '@/lib/db';
import { getUserDailyStats, submitGuess } from '@/lib/services/daily-game.service';

describe('daily-game.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-22T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('submitGuess WORD validation', () => {
    it('normalizes and stores uppercase WORD guesses', async () => {
      (prisma.dailyGame.findUnique as jest.Mock).mockResolvedValue({
        id: 'game_1',
        date: '2026-03-22',
        gameType: 'WORD',
        targetValue: 'SCORE',
      });
      (prisma.dailyGameAttempt.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.dailyGameAttempt.create as jest.Mock).mockImplementation(async ({ data }: any) => ({
        id: 'attempt_1',
        ...data,
      }));
      (prisma.user.update as jest.Mock).mockResolvedValue({ id: 'user_1' });

      const result = await submitGuess('game_1', 'user_1', ' score ');

      expect(result.isCorrect).toBe(true);
      expect(prisma.dailyGameAttempt.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            guesses: ['SCORE'],
          }),
        })
      );
    });

    it('rejects WORD guesses with invalid length', async () => {
      (prisma.dailyGame.findUnique as jest.Mock).mockResolvedValue({
        id: 'game_1',
        date: '2026-03-22',
        gameType: 'WORD',
        targetValue: 'SCORE',
      });
      (prisma.dailyGameAttempt.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(submitGuess('game_1', 'user_1', 'GOAL')).rejects.toThrow('Word must be exactly 5 letters');
    });

    it('rejects WORD guesses with non-letter characters', async () => {
      (prisma.dailyGame.findUnique as jest.Mock).mockResolvedValue({
        id: 'game_1',
        date: '2026-03-22',
        gameType: 'WORD',
        targetValue: 'SCORE',
      });
      (prisma.dailyGameAttempt.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(submitGuess('game_1', 'user_1', 'SC0RE')).rejects.toThrow('Word guesses must contain letters A-Z only');
    });
  });

  describe('getUserDailyStats currentStreak', () => {
    it('counts consecutive solved IST dates ending today', async () => {
      (prisma.dailyGameAttempt.findMany as jest.Mock).mockResolvedValue([
        { solved: true, guessCount: 3, dailyGame: { date: '2026-03-22', gameType: 'WORD' } },
        { solved: true, guessCount: 4, dailyGame: { date: '2026-03-21', gameType: 'WORD' } },
        { solved: false, guessCount: 6, dailyGame: { date: '2026-03-20', gameType: 'WORD' } },
      ]);

      const stats = await getUserDailyStats('user_1');

      expect(stats.currentStreak).toBe(2);
    });

    it('resets streak to 0 when today is unsolved', async () => {
      (prisma.dailyGameAttempt.findMany as jest.Mock).mockResolvedValue([
        { solved: false, guessCount: 6, dailyGame: { date: '2026-03-22', gameType: 'WORD' } },
        { solved: true, guessCount: 2, dailyGame: { date: '2026-03-21', gameType: 'WORD' } },
      ]);

      const stats = await getUserDailyStats('user_1');

      expect(stats.currentStreak).toBe(0);
    });

    it('handles same-day mixed attempts by treating solved date as solved', async () => {
      (prisma.dailyGameAttempt.findMany as jest.Mock).mockResolvedValue([
        { solved: false, guessCount: 6, dailyGame: { date: '2026-03-22', gameType: 'WORD' } },
        { solved: true, guessCount: 4, dailyGame: { date: '2026-03-22', gameType: 'WORD' } },
        { solved: true, guessCount: 3, dailyGame: { date: '2026-03-21', gameType: 'WORD' } },
      ]);

      const stats = await getUserDailyStats('user_1');

      expect(stats.currentStreak).toBe(2);
    });

    it('breaks streak when there is a missed day', async () => {
      (prisma.dailyGameAttempt.findMany as jest.Mock).mockResolvedValue([
        { solved: true, guessCount: 3, dailyGame: { date: '2026-03-22', gameType: 'WORD' } },
        { solved: true, guessCount: 4, dailyGame: { date: '2026-03-20', gameType: 'WORD' } },
      ]);

      const stats = await getUserDailyStats('user_1');

      expect(stats.currentStreak).toBe(1);
    });
  });
});
