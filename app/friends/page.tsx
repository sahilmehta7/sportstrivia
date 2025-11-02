import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getFriendDashboardData } from "@/lib/services/friend.service";
import { FriendsClient } from "./FriendsClient";

type FriendDashboardData = Awaited<ReturnType<typeof getFriendDashboardData>>;
type FriendRecord = FriendDashboardData["friends"][number];
type FriendRequestRecord =
  | FriendDashboardData["receivedRequests"][number]
  | FriendDashboardData["sentRequests"][number];

export default async function FriendsPage() {
  const session = await auth();

  // Middleware ensures session exists, so we can safely use it
  const userId = session!.user!.id;

  const { friends, receivedRequests, sentRequests } =
    await getFriendDashboardData(userId);

  const serializeFriend = (friendship: FriendRecord) => ({
    id: friendship.id,
    friend: {
      id: friendship.friend.id,
      name: friendship.friend.name,
      email: friendship.friend.email,
      image: friendship.friend.image,
      currentStreak: friendship.friend.currentStreak ?? 0,
      longestStreak: friendship.friend.longestStreak ?? 0,
    },
  });

  const serializeRequest = (request: FriendRequestRecord) => ({
    id: request.id,
    user: {
      id: request.user.id,
      name: request.user.name,
      email: request.user.email,
      image: request.user.image,
    },
    friend: {
      id: request.friend.id,
      name: request.friend.name,
      email: request.friend.email,
      image: request.friend.image,
    },
    createdAt: request.createdAt.toISOString(),
  });

  return (
    <FriendsClient
      friends={friends.map(serializeFriend)}
      receivedRequests={receivedRequests.map(serializeRequest)}
      sentRequests={sentRequests.map(serializeRequest)}
    />
  );
}
