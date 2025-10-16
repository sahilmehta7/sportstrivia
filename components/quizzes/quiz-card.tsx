import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  if (!duration) return "Flexible";
  const minutes = Math.max(1, Math.round(duration / 60));
  return `${minutes} min${minutes === 1 ? "" : "s"}`;
}

interface QuizCardProps {
  quiz: PublicQuizListItem;
}

export function QuizCard({ quiz }: QuizCardProps) {
  const coverImage = quiz.descriptionImageUrl;
  const rating = quiz.averageRating ?? 0;
  const hasRating = quiz.totalReviews > 0;
  const difficultyLabel = `${quiz.difficulty.charAt(0)}${quiz.difficulty
    .slice(1)
    .toLowerCase()}`;

  return (
    <Card className="group overflow-hidden border-border/60 bg-gradient-to-b from-background/80 via-background/90 to-muted/40 transition-shadow hover:shadow-xl">
      <Link href={`/quiz/${quiz.slug}`} className="block">
        <CardHeader className="p-0">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
            {coverImage ? (
              <Image
                src={coverImage}
                alt={`${quiz.title} cover`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                priority={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted via-muted/80 to-muted-foreground/10">
                <span className="text-sm font-medium text-muted-foreground/80">
                  Cover coming soon
                </span>
              </div>
            )}
            {quiz.isFeatured && (
              <div className="absolute left-4 top-4 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow">
                Featured
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-xl leading-tight">{quiz.title}</CardTitle>
            {quiz.difficulty && (
              <Badge className={cn("rounded-full px-3 py-1 text-xs", difficultyColors[quiz.difficulty])}>
                {difficultyLabel}
              </Badge>
            )}
          </div>
          {quiz.description && (
            <CardDescription className="line-clamp-3 text-sm text-muted-foreground">
              {quiz.description}
            </CardDescription>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatDuration(quiz.duration)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{quiz._count.attempts.toLocaleString()} attempts</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              {hasRating ? (
                <span>
                  {rating.toFixed(1)}
                  <span className="text-xs text-muted-foreground/80">
                    {` (${quiz.totalReviews})`}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground/80">New</span>
              )}
            </div>
          </div>
          {quiz.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {quiz.tags.slice(0, 4).map(({ tag }) => (
                <Badge
                  key={tag.slug}
                  variant="outline"
                  className="border-primary/20 bg-primary/5 text-xs font-normal text-primary/80"
                >
                  #{tag.name}
                </Badge>
              ))}
              {quiz.tags.length > 4 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{quiz.tags.length - 4} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
          <span>{quiz.sport ?? "Multi-sport"}</span>
          <span className="font-medium text-primary">Play quiz →</span>
        </CardFooter>
      </Link>
    </Card>
  );
}
