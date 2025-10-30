import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { StreakIndicator } from "@/components/shared/StreakIndicator";
import { Edit, UserPlus, UserMinus, Swords, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { glassText } from "@/components/showcase/ui/typography";

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    role: string;
    currentStreak: number;
    longestStreak: number;
  };
  isOwnProfile?: boolean;
  friendStatus?: "none" | "pending" | "friends";
  onAddFriend?: () => void;
  onRemoveFriend?: () => void;
  onChallenge?: () => void;
  showEditButton?: boolean;
}

export function ProfileHeader({
  user,
  isOwnProfile = false,
  friendStatus = "none",
  onAddFriend,
  onRemoveFriend,
  onChallenge,
  showEditButton = true,
}: ProfileHeaderProps) {
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "destructive";
      case "MODERATOR":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-[2.5rem] border px-8 py-12 shadow-xl",
      "bg-card/80 backdrop-blur-lg border-border/60"
    )}>
      {/* Background blur circles */}
      <div className="absolute -top-20 -right-14 h-56 w-56 rounded-full bg-orange-500/20 blur-[160px]" />
      <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-blue-500/15 blur-[160px]" />
      
      <div className="relative flex flex-col gap-8 md:flex-row md:items-start">
        {/* Avatar */}
        <div className="relative">
          <UserAvatar
            src={user.image}
            alt={user.name || "User"}
            size="xl"
            className="mx-auto md:mx-0 ring-4 ring-primary/20"
          />
          {/* Profile badge */}
          <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-500/30 to-pink-500/30 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-orange-100" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div>
            <div className="flex flex-col items-center gap-3 md:flex-row md:items-center">
              <h1 className={cn(glassText.h2)}>{user.name || "Anonymous User"}</h1>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={getRoleBadgeVariant(user.role)}
                  className="rounded-full px-3 py-1"
                >
                  {user.role}
                </Badge>
                <StreakIndicator
                  currentStreak={user.currentStreak}
                  longestStreak={user.longestStreak}
                  size="md"
                />
              </div>
            </div>
            {user.bio && (
              <p className={cn("mt-3 max-w-md", glassText.subtitle)}>{user.bio}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-3 md:justify-start">
            {isOwnProfile ? (
              <Link href="/profile/me">
                <Button 
                  variant="default"
                  className="rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_30px_-16px_rgba(249,115,22,0.55)] transition hover:-translate-y-0.5"
                  style={{ display: showEditButton ? undefined : "none" }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            ) : (
              <>
                {friendStatus === "none" && onAddFriend && (
                  <Button 
                    variant="default" 
                    onClick={onAddFriend}
                    className="rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_30px_-16px_rgba(249,115,22,0.55)] transition hover:-translate-y-0.5"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Friend
                  </Button>
                )}
                {friendStatus === "pending" && (
                  <Button 
                    variant="outline" 
                    disabled
                    className="rounded-full border-border/60 bg-background/60 backdrop-blur-sm"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Request Pending
                  </Button>
                )}
                {friendStatus === "friends" && (
                  <>
                    {onChallenge && (
                      <Button 
                        variant="default" 
                        onClick={onChallenge}
                        className="rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_30px_-16px_rgba(249,115,22,0.55)] transition hover:-translate-y-0.5"
                      >
                        <Swords className="mr-2 h-4 w-4" />
                        Challenge
                      </Button>
                    )}
                    {onRemoveFriend && (
                      <Button 
                        variant="outline" 
                        onClick={onRemoveFriend}
                        className="rounded-full border-border/60 bg-background/60 backdrop-blur-sm"
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Remove Friend
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

