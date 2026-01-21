"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { StreakIndicator } from "@/components/shared/StreakIndicator";
import { CreateChallengeModal } from "@/components/challenges/CreateChallengeModal";
import { Eye, Swords, UserMinus, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
      <div className="relative group">
        <div className={cn(
          "relative overflow-hidden rounded-[2.5rem] border p-6 glass-elevated shadow-glass transition-all duration-300 group-hover:bg-white/5 group-hover:border-white/20 hover:scale-[1.02]",
        )}>
          <div className="flex items-start gap-6">
            {/* Avatar Section */}
            <div className="relative">
              <Link href={`/profile/${friend.id}`}>
                <div className="p-1 rounded-2xl glass border border-white/5 shadow-neon-cyan/5 group-hover:border-primary/40 transition-colors">
                  <UserAvatar
                    src={friend.image}
                    alt={friend.name || "Friend"}
                    size="lg"
                    className="h-20 w-20 rounded-xl"
                  />
                </div>
              </Link>
              <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-lg glass border border-white/20 flex items-center justify-center text-primary shadow-lg">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>

            {/* Info Section */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="space-y-1">
                <Link href={`/profile/${friend.id}`}>
                  <h3 className="text-lg font-black uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                    {friend.name || "UNIDENTIFIED"}
                  </h3>
                </Link>
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase truncate opacity-60">
                  {friend.email}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <StreakIndicator
                  currentStreak={friend.currentStreak}
                  longestStreak={friend.longestStreak}
                  size="sm"
                />
                <div className="h-1 w-1 rounded-full bg-white/10" />
                <div className="text-[10px] font-black uppercase tracking-widest text-primary/60">ACTIVE LINK</div>
              </div>
            </div>

            {/* Actions Section */}
            {showActions && (
              <div className="flex flex-col gap-2">
                <Link href={`/profile/${friend.id}`}>
                  <Button variant="glass" size="icon" className="h-10 w-10 rounded-xl border-white/5 hover:border-primary/20 hover:text-primary">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
                <Button variant="neon" size="icon" onClick={handleChallengeClick} className="h-10 w-10 rounded-xl">
                  <Swords className="h-4 w-4" />
                </Button>
                {onRemove && (
                  <Button variant="ghost" size="icon" onClick={onRemove} className="h-10 w-10 rounded-xl text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10">
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Visual Decoration */}
          <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
            <ShieldCheck className="h-20 w-20" />
          </div>
        </div>
      </div>

      <CreateChallengeModal
        isOpen={showChallengeModal}
        onClose={() => setShowChallengeModal(false)}
        onSuccess={() => setShowChallengeModal(false)}
        preselectedFriendId={friend.id}
      />
    </>
  );
}
