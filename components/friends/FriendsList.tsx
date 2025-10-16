"use client";

import { FriendCard } from "./FriendCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users } from "lucide-react";

interface Friend {
  id: string;
  friend: {
    id: string;
    name: string | null;
    image: string | null;
    email: string;
    currentStreak: number;
    longestStreak: number;
  };
}

interface FriendsListProps {
  friends: Friend[];
  onChallenge?: (friendId: string) => void;
  onRemove?: (friendshipId: string) => void;
}

export function FriendsList({ friends, onChallenge, onRemove }: FriendsListProps) {
  if (friends.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No friends yet"
        description="Add friends to compete with them and see their progress"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {friends.map((friendship) => (
        <FriendCard
          key={friendship.id}
          friend={friendship.friend}
          onChallenge={onChallenge ? () => onChallenge(friendship.friend.id) : undefined}
          onRemove={onRemove ? () => onRemove(friendship.id) : undefined}
        />
      ))}
    </div>
  );
}

