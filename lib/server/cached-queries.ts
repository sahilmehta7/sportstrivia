import { cache } from 'react';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * Get current user with React.cache for per-request deduplication.
 * Multiple calls within the same request will only execute the query once.
 * 
 * @example
 * // In Server Components or Server Actions:
 * const user = await getCurrentUser();
 */
export const getCurrentUser = cache(async () => {
    const session = await auth();
    if (!session?.user?.id) return null;

    return prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
        },
    });
});

/**
 * Get user by ID with caching for per-request deduplication.
 * 
 * @example
 * // In Server Components or Server Actions:
 * const user = await getUserById(userId);
 */
export const getUserById = cache(async (userId: string) => {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
        },
    });
});

/**
 * Get user stats with caching for per-request deduplication.
 */
export const getUserStats = cache(async (userId: string) => {
    const [attemptCount, totalPoints] = await Promise.all([
        prisma.quizAttempt.count({
            where: {
                userId,
                completedAt: { not: null },
            },
        }),
        prisma.quizAttempt.aggregate({
            where: {
                userId,
                completedAt: { not: null },
            },
            _sum: { totalPoints: true },
        }),
    ]);

    return {
        totalAttempts: attemptCount,
        totalPoints: totalPoints._sum.totalPoints ?? 0,
    };
});
