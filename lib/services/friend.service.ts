import { prisma } from "@/lib/db";
import { FriendStatus } from "@prisma/client";
import { friendInclude } from "@/lib/dto/friend-filters.dto";

export async function getFriendDashboardData(userId: string) {
  const [friends, receivedRequests, sentRequests] = await Promise.all([
    prisma.friend.findMany({
      where: {
        userId,
        status: FriendStatus.ACCEPTED,
      },
      orderBy: { createdAt: "desc" },
      include: friendInclude,
      take: 100,
    }),
    prisma.friend.findMany({
      where: {
        friendId: userId,
        status: FriendStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
      include: friendInclude,
      take: 100,
    }),
    prisma.friend.findMany({
      where: {
        userId,
        status: FriendStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
      include: friendInclude,
      take: 100,
    }),
  ]);

  return {
    friends,
    receivedRequests,
    sentRequests,
  };
}

