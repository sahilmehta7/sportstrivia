"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award, Lock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { glassText } from "@/components/showcase/ui/typography";

interface BadgeItem {
  badge: {
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
  };
  earned: boolean;
  earnedAt?: Date | null;
}

interface BadgeShowcaseProps {
  badges: BadgeItem[];
}

export function BadgeShowcase({ badges }: BadgeShowcaseProps) {
  const earnedBadges = badges.filter((b) => b.earned);
  const lockedBadges = badges.filter((b) => !b.earned);

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <Card className="relative overflow-hidden rounded-[2rem] border shadow-xl bg-card/80 backdrop-blur-lg border-border/60">
      {/* Background blur circles */}
      <div className="absolute -top-20 -right-14 h-56 w-56 rounded-full bg-orange-500/20 blur-[160px]" />
      <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-blue-500/15 blur-[160px]" />
      
      <CardHeader className="relative">
        <CardTitle className={cn("flex items-center gap-2", glassText.h2)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-500/30 to-pink-500/30">
            <Award className="h-4 w-4 text-orange-100" />
          </div>
          Badges
        </CardTitle>
        <CardDescription className={cn(glassText.subtitle)}>
          {earnedBadges.length} of {badges.length} earned
        </CardDescription>
      </CardHeader>
      <CardContent className="relative">
        {badges.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className={cn("text-sm", glassText.subtitle)}>
              No badges available
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Earned badges first */}
            {earnedBadges.map(({ badge, earnedAt }) => (
              <div
                key={badge.id}
                className="group relative overflow-hidden rounded-[1.5rem] border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/20 p-5 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                title={`Earned on ${formatDate(earnedAt)}`}
              >
                {/* Badge glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-pink-500/20 opacity-0 transition-opacity group-hover:opacity-100" />
                
                <div className="relative flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-orange-500/30 to-pink-500/30 backdrop-blur-sm">
                    <Award className="h-6 w-6 text-orange-100" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className={cn("font-semibold leading-none", glassText.h3)}>{badge.name}</h4>
                    <p className={cn("text-xs", glassText.subtitle)}>
                      {badge.description}
                    </p>
                    {earnedAt && (
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <p className="text-xs text-primary font-medium">
                          {formatDate(earnedAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Locked badges */}
            {lockedBadges.map(({ badge }) => (
              <div
                key={badge.id}
                className="relative overflow-hidden rounded-[1.5rem] border border-border/40 bg-muted/30 p-5 opacity-60"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted/50">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className={cn("font-semibold leading-none text-muted-foreground", glassText.h3)}>
                      {badge.name}
                    </h4>
                    <p className={cn("text-xs", glassText.subtitle)}>
                      {badge.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
