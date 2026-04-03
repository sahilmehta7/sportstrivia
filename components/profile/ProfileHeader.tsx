import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { StreakIndicator } from "@/components/shared/StreakIndicator";
import { Edit, UserPlus, UserMinus, Swords, Sparkles,  Calendar, Verified } from "lucide-react";
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
  compact?: boolean;
  flat?: boolean;
}

export function ProfileHeader({
  user,
  isOwnProfile = false,
  friendStatus = "none",
  onAddFriend,
  onRemoveFriend,
  onChallenge,
  showEditButton = true,
  compact = false,
  flat = false,
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
    <div className={cn("relative group", compact && "group-static")}>
      {!compact && !flat && (
        <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-full opacity-50 -z-10" />
      )}

      <div className={cn(
        "relative overflow-hidden border",
        compact
          ? "p-4 sm:p-5"
          : "rounded-[3rem] p-10 lg:p-14",
        flat
          ? "rounded-none bg-card border-border shadow-none"
          : "border-white/10 glass-elevated shadow-glass-lg"
      )}>
        <div className={cn(
          "relative flex flex-col items-center lg:flex-row lg:items-center",
          compact ? "gap-4" : "gap-10"
        )}>

          {/* Avatar Section */}
          <div className="relative">
            <div className={cn(
              "relative p-2 border",
              flat ? "rounded-none bg-muted/40 border-border shadow-none" : "rounded-full glass border-white/20 shadow-neon-cyan/10"
            )}>
              <UserAvatar
                src={user.image}
                alt={user.name || "User"}
                size="xl"
                className={cn(
                  compact ? "h-20 w-20 sm:h-24 sm:w-24" : "h-32 w-32 sm:h-40 sm:w-40"
                )}
              />
            </div>
            {/* Level/Tier indicator overlay */}
            <div className={cn(
              "absolute -bottom-2 -right-2 h-10 w-10 border flex items-center justify-center text-primary",
              flat ? "rounded-none bg-card border-border shadow-none" : "rounded-2xl glass border-white/20 shadow-lg",
              !compact && "h-12 w-12"
            )}>
              <Verified className="h-6 w-6" />
            </div>
          </div>

          {/* Info Section */}
          <div className={cn("flex-1 text-center lg:text-left", compact ? "space-y-3" : "space-y-6")}>
            <div className={cn(compact ? "space-y-2" : "space-y-4")}>
              <div className={cn("flex flex-col items-center lg:flex-row", compact ? "gap-2" : "gap-4")}>
                <h1 className={cn(
                  compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-6xl",
                  "font-black uppercase tracking-tighter",
                  flat ? "text-foreground" : getGradientText("neon")
                )}>
                  {user.name || "UNREGISTERED"}
                </h1>
                <Badge className={cn(
                  "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest border",
                  flat ? "rounded-none" : "rounded-full",
                  getRoleBadgeStyles(user.role)
                )}>
                  {user.role}
                </Badge>
              </div>

              <div className={cn("flex flex-wrap justify-center lg:justify-start", compact ? "gap-2" : "gap-4")}>
                <StreakIndicator
                  currentStreak={user.currentStreak}
                  longestStreak={user.longestStreak}
                  size="md"
                />
                <div className={cn(
                  "flex items-center gap-2 px-3 py-1.5 border text-[10px] font-black uppercase tracking-widest text-muted-foreground/60",
                  flat ? "rounded-none bg-muted/40 border-border" : "rounded-full glass border-white/5"
                )}>
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
            <div className={cn("flex flex-wrap justify-center lg:justify-start", compact ? "gap-2 pt-2" : "gap-4 pt-4")}>
              {isOwnProfile ? (
                showEditButton && (
                  <Link href="/profile/me">
                    <Button variant="accent" size="lg" className="w-full sm:w-auto">
                      <Edit className="mr-3 h-4 w-4" />
                      CONFIGURE PROFILE
                    </Button>
                  </Link>
                )
              ) : (
                <>
                  {friendStatus === "none" && onAddFriend && (
                    <Button variant="accent" size="lg" onClick={onAddFriend} className="w-full sm:w-auto">
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
                        <Button variant="accent" size="lg" onClick={onChallenge} className="w-full sm:w-auto">
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
        {!compact && !flat && (
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles className="h-32 w-32" />
          </div>
        )}
      </div>
    </div>
  );
}
