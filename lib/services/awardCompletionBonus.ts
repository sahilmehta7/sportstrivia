import { prisma } from '@/lib/db';

export async function awardCompletionBonusIfEligible(params: {
  userId: string;
  quizId: string;
}): Promise<number> {
  const { userId, quizId } = params;

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || !quiz.completionBonus || quiz.completionBonus <= 0) return 0;

  const existing = await prisma.quizCompletionBonusAward.findUnique({
    where: { quizId_userId: { quizId, userId } },
  });
  if (existing) return 0;

  await prisma.$transaction([
    prisma.quizCompletionBonusAward.create({ data: { quizId, userId } }),
    prisma.user.update({
      where: { id: userId },
      data: { totalPoints: { increment: quiz.completionBonus } },
    }),
  ]);

  return quiz.completionBonus;
}


