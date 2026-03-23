import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { handleError, successResponse } from "@/lib/errors";

export async function GET() {
  try {
    const user = await requireAuth();

    const follows = await prisma.userFollowedTopic.findMany({
      where: { userId: user.id },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            slug: true,
            schemaType: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return successResponse({ follows });
  } catch (error) {
    return handleError(error);
  }
}
