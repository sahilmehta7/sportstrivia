import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";
import { prisma } from "@/lib/db";

// GET /api/users/me/topic-stats - Get all topic-wise stats for current user
export async function GET() {
	try {
		const user = await requireAuth();

		let topicStats: any[] = [];
		try {
			topicStats = (await prisma.userTopicStats.findMany({
				where: { userId: user.id },
				orderBy: [
					{ successRate: "desc" },
					{ questionsAnswered: "desc" },
				],
				include: {
						topic: { select: { id: true, name: true, slug: true, displayEmoji: true } as any } as any,
				},
			})) as any[];
		} catch {
				// Fallback without displayEmoji if Prisma client doesn't have the field yet
			topicStats = await prisma.userTopicStats.findMany({
				where: { userId: user.id },
				orderBy: [
					{ successRate: "desc" },
					{ questionsAnswered: "desc" },
				],
				include: {
					topic: { select: { id: true, name: true, slug: true } },
				},
			});
		}

		return successResponse({
			topics: topicStats,
			total: topicStats.length,
		});
	} catch (error) {
		return handleError(error);
	}
}
