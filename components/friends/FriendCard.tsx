"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { StreakIndicator } from "@/components/shared/StreakIndicator";
import { CreateChallengeModal } from "@/components/challenges/CreateChallengeModal";
import { Eye, Swords, UserMinus } from "lucide-react";
import Link from "next/link";

interface FriendCardProps {
  friend: {
    id: string;
    name: string | null;
    image: string | null;
    email: string;
    currentStreak: number;
    longestStreak: number;
  };
  showActions?: boolean;
  onChallenge?: () => void;
  onRemove?: () => void;
}

export function FriendCard({
  friend,
  showActions = true,
  onChallenge,
  onRemove,
}: FriendCardProps) {
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  const handleChallengeClick = () => {
    if (onChallenge) {
      onChallenge();
    } else {
      setShowChallengeModal(true);
    }
  };

  return (
    <>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Link href={`/profile/${friend.id}`}>
            <UserAvatar
              src={friend.image}
              alt={friend.name || "Friend"}
              size="lg"
              className="transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Info */}
          <div className="flex-1 space-y-2">
            <Link href={`/profile/${friend.id}`}>
              <h3 className="font-semibold hover:underline">
                {friend.name || "Anonymous"}
              </h3>
            </Link>
            <p className="text-xs text-muted-foreground">{friend.email}</p>
            <StreakIndicator
              currentStreak={friend.currentStreak}
              longestStreak={friend.longestStreak}
              size="sm"
            />
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex flex-col gap-2">
              <Link href={`/profile/${friend.id}`}>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleChallengeClick}>
                <Swords className="h-4 w-4" />
              </Button>
              {onRemove && (
                <Button variant="ghost" size="sm" onClick={onRemove}>
                  <UserMinus className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>

      <CreateChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        onSuccess={() => setShowChallengeModal(false)}
        preselectedFriendId={friend.id}
      />
    </>
  );
}
