"use client";

import { FriendCard } from "./FriendCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users, UserSearch } from "lucide-react";

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
      <div className="py-24 text-center space-y-6 rounded-[3rem] glass border border-dashed border-white/10">
        <div className="h-16 w-16 mx-auto rounded-full glass border border-white/5 flex items-center justify-center text-muted-foreground/20">
          <Users className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">NO CONNECTIONS DETECTED</p>
          <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-widest px-4">INITIATE REQUESTS TO EXPAND YOUR TACTICAL NETWORK</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
