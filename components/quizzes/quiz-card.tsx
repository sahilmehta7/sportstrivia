import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter as _CardFooter,
  CardHeader as _CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Difficulty } from "@prisma/client";
import { Clock, Star, Users } from "lucide-react";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";

const _difficultyColors: Record<Difficulty, string> = {
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
  // Format difficulty: EASY -> Easy, but we'll use uppercase in UI
  const difficultyDisplay = quiz.difficulty;

  return (
    <Card className="group relative overflow-hidden rounded-[1.5rem] border border-border/60 bg-card transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-athletic">
      <Link href={`/quizzes/${quiz.slug}`} className="flex h-full flex-col">
        {/* Cover Image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={`${quiz.title} cover`}
              fill
              className="object-cover grayscale-[0.45] transition-all duration-500 will-change-transform group-hover:grayscale-0 group-hover:scale-105"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={false}
            />
          ) : (
            // Fallback pattern
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-muted to-background">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                No Cover
              </span>
            </div>
          )}

          {/* Featured Badge - Minimal */}
          {quiz.isFeatured && (
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-sm bg-emerald-500/90 px-2 py-0.5 backdrop-blur-md">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                Featured
              </span>
            </div>
          )}

          {/* Difficulty Badge - Absolute positioning for tighter layout */}
          <div className="absolute bottom-3 right-3">
            <Badge
              variant="outline"
              className={cn(
                "rounded-sm border-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md",
                quiz.difficulty === "EASY" && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                quiz.difficulty === "MEDIUM" && "bg-amber-500/15 text-amber-700 dark:text-amber-300",
                quiz.difficulty === "HARD" && "bg-rose-500/15 text-rose-700 dark:text-rose-300"
              )}
            >
              {difficultyDisplay}
            </Badge>
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col justify-between space-y-4 p-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {quiz.sport ?? "Multi-sport"}
              </span>
            </div>
            <CardTitle className="line-clamp-2 text-lg font-bold uppercase leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
              {quiz.title}
            </CardTitle>

            {quiz.description && (
              <CardDescription className="line-clamp-2 text-xs font-medium text-muted-foreground">
                {quiz.description}
              </CardDescription>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDuration(quiz.duration)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span>{quiz._count.attempts > 1000 ? `${(quiz._count.attempts / 1000).toFixed(1)}k` : quiz._count.attempts}</span>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 text-xs font-bold text-accent">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              {hasRating ? <span>{rating.toFixed(1)}</span> : <span className="text-muted-foreground">--</span>}
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
