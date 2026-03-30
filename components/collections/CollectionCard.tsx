import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PreviewQuiz = {
  order: number;
  quiz: {
    id: string;
    slug: string;
    title: string;
    difficulty: string;
    sport: string | null;
    descriptionImageUrl: string | null;
  };
};

type CollectionCardProps = {
  collection: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    coverImageUrl: string | null;
    type: string;
    quizCount: number;
    previewQuizzes?: PreviewQuiz[];
  };
  nextQuiz?:
    | {
        id: string;
        slug: string;
        title: string;
        order: number;
      }
    | null;
  completedQuizCount?: number;
  totalQuizzes?: number;
};

export function CollectionCard({
  collection,
  nextQuiz,
  completedQuizCount,
  totalQuizzes,
}: CollectionCardProps) {
  const progress =
    typeof completedQuizCount === "number" && typeof totalQuizzes === "number"
      ? `${completedQuizCount}/${totalQuizzes}`
      : null;

  const href = nextQuiz ? `/quizzes/${nextQuiz.slug}` : `/collections/${collection.slug}`;
  const ctaLabel = nextQuiz ? `Resume #${nextQuiz.order}` : "View collection";

  return (
    <Card className="h-full border-white/10 bg-white/5 transition hover:border-primary/50">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary" className="rounded-full">
            {collection.type.replaceAll("_", " ")}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {collection.quizCount} quizzes
          </span>
        </div>
        <CardTitle className="line-clamp-2 text-base">{collection.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {collection.description ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {collection.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Curated quiz journey for focused binge play.
          </p>
        )}

        {progress ? (
          <p className="text-xs font-medium text-primary">
            Progress: {progress}
          </p>
        ) : null}

        {nextQuiz ? (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            Next: {nextQuiz.title}
          </p>
        ) : null}

        <Link
          href={href}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary transition hover:opacity-80"
        >
          <Layers className="h-4 w-4" />
          {ctaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
