import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Difficulty } from "@prisma/client";
import { Clock, Star, Users } from "lucide-react";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";

const difficultyColors: Record<Difficulty, string> = {
  EASY: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
  MEDIUM: "bg-amber-500/10 text-amber-600 border border-amber-500/30",
  HARD: "bg-rose-500/10 text-rose-600 border border-rose-500/30",
};

function formatDuration(duration?: number | null) {
  if (!duration) return null;
  const minutes = Math.max(1, Math.round((duration || 0) / 60));
  return `${minutes} min${minutes === 1 ? "" : "s"}`;
}

interface FeaturedCardProps {
  quiz: PublicQuizListItem;
  className?: string;
}

export function FeaturedCard({ quiz, className }: FeaturedCardProps) {
  const duration = formatDuration(quiz.duration);
  const rating = quiz.averageRating ?? 0;
  const hasRating = quiz.totalReviews > 0;
  const difficultyLabel = `${quiz.difficulty.charAt(0)}${quiz.difficulty
    .slice(1)
    .toLowerCase()}`;

  return (
    <Card className={cn("flex h-full w-full max-w-lg flex-col overflow-hidden border-border/60 bg-gradient-to-br from-background via-background to-muted/40 shadow transition hover:-translate-y-1 hover:shadow-xl", className)}>
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {quiz.descriptionImageUrl ? (
          <Image
            src={quiz.descriptionImageUrl}
            alt={quiz.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-primary/10 to-purple-500/20">
            <span className="text-sm font-medium text-primary/70">Cover coming soon</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <Badge className={cn("rounded-full px-3 py-1 text-xs font-semibold", difficultyColors[quiz.difficulty])}>
            {difficultyLabel}
          </Badge>
          {quiz.sport && (
            <span className="rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              {quiz.sport}
            </span>
          )}
        </div>
      </div>

      <CardContent className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-2">
          <h3 className="line-clamp-2 text-xl font-semibold text-foreground">{quiz.title}</h3>
          {quiz.description && (
            <p className="line-clamp-3 text-sm text-muted-foreground">{quiz.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{duration ?? "Flexible"}</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{quiz._count.attempts.toLocaleString()} plays</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-primary text-primary" />
            {hasRating ? `${rating.toFixed(1)} (${quiz.totalReviews})` : "New"}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-6 py-4">
        <div className="text-sm text-muted-foreground">Ready for a challenge?</div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href={`/quizzes/${quiz.slug}`}>Play now</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
