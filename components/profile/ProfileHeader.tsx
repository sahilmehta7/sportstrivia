import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { StreakIndicator } from "@/components/shared/StreakIndicator";
import { Edit, UserPlus, UserMinus, Swords, Sparkles, MapPin, Calendar, Verified } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    bio: string | null;
    role: string;
    currentStreak: number;
    longestStreak: number;
    createdAt?: string;
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
  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-secondary/20 text-secondary border-secondary/30 shadow-neon-magenta/20";
      case "MODERATOR":
        return "bg-primary/20 text-primary border-primary/30 shadow-neon-cyan/20";
      default:
        return "bg-white/10 text-white/70 border-white/10";
    }
  };

  return (
    <div className="relative group">
      {/* Glow behind the header */}
      <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full opacity-50 -z-10" />

      <div className={cn(
        "relative overflow-hidden rounded-[3rem] border border-white/10 p-10 lg:p-14 glass-elevated shadow-glass-lg",
      )}>
        <div className="relative flex flex-col items-center gap-10 lg:flex-row lg:items-center">

          {/* Avatar Section */}
          <div className="relative">
            <div className="relative p-2 rounded-full glass border border-white/20 shadow-neon-cyan/10">
              <UserAvatar
                src={user.image}
                alt={user.name || "User"}
                size="xl"
                className="h-32 w-32 sm:h-40 sm:w-40"
              />
            </div>
            {/* Level/Tier indicator overlay */}
            <div className="absolute -bottom-2 -right-2 h-12 w-12 rounded-2xl glass border border-white/20 shadow-lg flex items-center justify-center text-primary">
              <Verified className="h-6 w-6" />
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 lg:flex-row">
                <h1 className={cn(
                  "text-4xl sm:text-6xl font-black uppercase tracking-tighter",
                  getGradientText("neon")
                )}>
                  {user.name || "UNREGISTERED"}
                </h1>
                <Badge className={cn(
                  "rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border",
                  getRoleBadgeStyles(user.role)
                )}>
                  {user.role}
                </Badge>
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                <StreakIndicator
                  currentStreak={user.currentStreak}
                  longestStreak={user.longestStreak}
                  size="md"
                />
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  <Calendar className="h-3.5 w-3.5" />
                  EST. {user.createdAt ? new Date(user.createdAt).getFullYear() : '2024'}
                </div>
              </div>
            </div>

            {user.bio && (
              <p className="max-w-xl text-lg text-muted-foreground font-medium leading-relaxed">
                {user.bio}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
              {isOwnProfile ? (
                showEditButton && (
                  <Link href="/profile/me">
                    <Button variant="neon" size="lg" className="w-full sm:w-auto">
                      <Edit className="mr-3 h-4 w-4" />
                      CONFIGURE PROFILE
                    </Button>
                  </Link>
                )
              ) : (
                <>
                  {friendStatus === "none" && onAddFriend && (
                    <Button variant="neon" size="lg" onClick={onAddFriend} className="w-full sm:w-auto">
                      <UserPlus className="mr-3 h-4 w-4" />
                      TRANSMIT REQUEST
                    </Button>
                  )}
                  {friendStatus === "pending" && (
                    <Button variant="glass" size="lg" disabled className="w-full sm:w-auto opacity-50">
                      <Sparkles className="mr-3 h-4 w-4" />
                      SIGNAL PENDING
                    </Button>
                  )}
                  {friendStatus === "friends" && (
                    <>
                      {onChallenge && (
                        <Button variant="neon" size="lg" onClick={onChallenge} className="w-full sm:w-auto">
                          <Swords className="mr-3 h-4 w-4" />
                          CHALLENGE ARENA
                        </Button>
                      )}
                      {onRemoveFriend && (
                        <Button variant="glass" size="lg" onClick={onRemoveFriend} className="w-full sm:w-auto">
                          <UserMinus className="mr-3 h-4 w-4" />
                          SEVER LINK
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Decorative background elements inside card */}
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Sparkles className="h-32 w-32" />
        </div>
      </div>
    </div>
  );
}
