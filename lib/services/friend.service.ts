import { prisma } from "@/lib/db";
import { FriendStatus } from "@prisma/client";
import { friendInclude } from "@/lib/dto/friend-filters.dto";

/**
 * Get friend dashboard data including friends from both directions
 * 
 * The Friend model stores relationships unidirectionally:
 * - userId is the person who sent the request
 * - friendId is the person who received the request
 * 
 * To show all accepted friends, we need to query both directions.
 */
export async function getFriendDashboardData(userId: string) {
  const [
    friendsAsRequester,
    friendsAsRecipient,
    receivedRequests,
    sentRequests
  ] = await Promise.all([
    // Friends where I sent the request (and they accepted)
    prisma.friend.findMany({
      where: {
        userId,
        status: FriendStatus.ACCEPTED,
      },
      orderBy: { createdAt: "desc" },
      include: friendInclude,
      take: 100,
    }),
    // Friends where I received the request (and I accepted)
    prisma.friend.findMany({
      where: {
        friendId: userId,
        status: FriendStatus.ACCEPTED,
      },
      orderBy: { createdAt: "desc" },
      include: friendInclude,
      take: 100,
    }),
    // Pending requests I received
    prisma.friend.findMany({
      where: {
        friendId: userId,
        status: FriendStatus.PENDING,
      },
      orderBy: { createdAt: "desc" },
      include: friendInclude,
      take: 100,
    }),
    // Pending requests I sent
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

  // Merge friends from both directions into a unified list
  // Normalize so the "friend" field always contains the OTHER user
  const friends = [
    ...friendsAsRequester.map(f => ({
      ...f,
      // For requests I sent, 'friend' already points to the other user
      direction: "sent" as const,
    })),
    ...friendsAsRecipient.map(f => ({
      ...f,
      // For requests I received, 'user' points to the other user
      // Swap for consistent access pattern in UI
      direction: "received" as const,
      // Note: UI should use f.user for the friend's info when direction === "received"
    })),
  ];

  return {
    friends,
    receivedRequests,
    sentRequests,
    // Provide counts for quick access
    counts: {
      totalFriends: friends.length,
      pendingReceived: receivedRequests.length,
      pendingSent: sentRequests.length,
    },
  };
}

/**
 * Check if two users are friends (in either direction)
 */
export async function areFriends(userId: string, otherUserId: string): Promise<boolean> {
  const friendship = await prisma.friend.findFirst({
    where: {
      OR: [
        { userId, friendId: otherUserId, status: FriendStatus.ACCEPTED },
        { userId: otherUserId, friendId: userId, status: FriendStatus.ACCEPTED },
      ],
    },
  });
  return !!friendship;
}

/**
 * Get all friend IDs for a user (both directions)
 */
export async function getFriendIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friend.findMany({
    where: {
      OR: [
        { userId, status: FriendStatus.ACCEPTED },
        { friendId: userId, status: FriendStatus.ACCEPTED },
      ],
    },
    select: {
      userId: true,
      friendId: true,
    },
  });

  // Extract the OTHER user's ID from each friendship
  return friendships.map(f =>
    f.userId === userId ? f.friendId : f.userId
  );
}
