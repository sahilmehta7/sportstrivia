"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Badges
        </CardTitle>
        <CardDescription>
          {earnedBadges.length} of {badges.length} earned
        </CardDescription>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No badges available
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Earned badges first */}
            {earnedBadges.map(({ badge, earnedAt }) => (
              <div
                key={badge.id}
                className="group relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 transition-all hover:shadow-md"
                title={`Earned on ${formatDate(earnedAt)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold leading-none">{badge.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {badge.description}
                    </p>
                    {earnedAt && (
                      <p className="text-xs text-primary">
                        {formatDate(earnedAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Locked badges */}
            {lockedBadges.map(({ badge }) => (
              <div
                key={badge.id}
                className="relative overflow-hidden rounded-lg border border-border/60 bg-muted/20 p-4 opacity-60"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-muted">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold leading-none text-muted-foreground">
                      {badge.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
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

