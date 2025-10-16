import { prisma } from "@/lib/db";
import { handleError, successResponse } from "@/lib/errors";

// GET /api/badges - List all available badges
export async function GET() {
  try {
    const badges = await prisma.badge.findMany({
      orderBy: { name: "asc" },
      include: {
      _count: {
        select: {
          userBadges: true, // Count how many users earned this badge
        },
      },
      },
    });

    return successResponse({ badges });
  } catch (error) {
    return handleError(error);
  }
}
