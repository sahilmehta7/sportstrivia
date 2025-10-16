import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { StreakIndicator } from "@/components/shared/StreakIndicator";
import { Edit, UserPlus, UserMinus, Swords } from "lucide-react";
import Link from "next/link";

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
}

export function ProfileHeader({
  user,
  isOwnProfile = false,
  friendStatus = "none",
  onAddFriend,
  onRemoveFriend,
  onChallenge,
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
    <div className="rounded-lg border bg-card p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Avatar */}
        <UserAvatar
          src={user.image}
          alt={user.name || "User"}
          size="xl"
          className="mx-auto md:mx-0"
        />

        {/* Info */}
        <div className="flex-1 space-y-3 text-center md:text-left">
          <div>
            <div className="flex flex-col items-center gap-2 md:flex-row md:items-center">
              <h1 className="text-2xl font-bold">{user.name || "Anonymous User"}</h1>
              <div className="flex items-center gap-2">
                <Badge variant={getRoleBadgeVariant(user.role)}>
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
              <p className="mt-2 text-muted-foreground">{user.bio}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-2 md:justify-start">
            {isOwnProfile ? (
              <Link href="/profile/me">
                <Button variant="default">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </Link>
            ) : (
              <>
                {friendStatus === "none" && onAddFriend && (
                  <Button variant="default" onClick={onAddFriend}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Friend
                  </Button>
                )}
                {friendStatus === "pending" && (
                  <Button variant="outline" disabled>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Request Pending
                  </Button>
                )}
                {friendStatus === "friends" && (
                  <>
                    {onChallenge && (
                      <Button variant="default" onClick={onChallenge}>
                        <Swords className="mr-2 h-4 w-4" />
                        Challenge
                      </Button>
                    )}
                    {onRemoveFriend && (
                      <Button variant="outline" onClick={onRemoveFriend}>
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

