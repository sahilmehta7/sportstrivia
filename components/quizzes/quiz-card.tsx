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
  // Format difficulty: EASY -> Easy, but we'll use uppercase in UI
  const difficultyDisplay = quiz.difficulty;

  return (
    <Card className="group relative overflow-hidden rounded-lg border-white/10 bg-zinc-950 transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-black/50">
      <Link href={`/quizzes/${quiz.slug}`} className="flex h-full flex-col">
        {/* Cover Image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-900">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={`${quiz.title} cover`}
              fill
              className="object-cover transition-transform duration-500 will-change-transform group-hover:scale-105"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={false}
            />
          ) : (
            // Fallback pattern
            <div className="flex h-full w-full items-center justify-center bg-zinc-900 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-zinc-950">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-700">
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
                quiz.difficulty === 'EASY' && "bg-emerald-500/20 text-emerald-300",
                quiz.difficulty === 'MEDIUM' && "bg-amber-500/20 text-amber-300",
                quiz.difficulty === 'HARD' && "bg-rose-500/20 text-rose-300"
              )}
            >
              {difficultyDisplay}
            </Badge>
          </div>
        </div>

        <CardContent className="flex flex-1 flex-col justify-between space-y-4 p-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                {quiz.sport ?? "Multi-sport"}
              </span>
            </div>
            <CardTitle className="line-clamp-2 text-lg font-bold uppercase leading-tight tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              {quiz.title}
            </CardTitle>

            {quiz.description && (
              <CardDescription className="line-clamp-2 text-xs font-medium text-zinc-400">
                {quiz.description}
              </CardDescription>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
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
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {hasRating ? <span>{rating.toFixed(1)}</span> : <span className="text-zinc-600">--</span>}
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}
