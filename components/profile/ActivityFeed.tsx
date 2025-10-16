import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

interface QuizAttempt {
  id: string;
  score: number | null;
  passed: boolean | null;
  completedAt: Date | string;
  quiz: {
    title: string;
    slug: string;
  };
}

interface ActivityFeedProps {
  attempts: QuizAttempt[];
}

export function ActivityFeed({ attempts }: ActivityFeedProps) {
  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {attempts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No quiz attempts yet
          </p>
        ) : (
          <div className="space-y-3">
            {attempts.map((attempt) => (
              <Link
                key={attempt.id}
                href={`/quizzes/${attempt.quiz.slug}`}
                className="block"
              >
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
                  <div className="flex items-center gap-3">
                    {attempt.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{attempt.quiz.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(attempt.completedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {attempt.score !== null && (
                      <span className="text-sm font-semibold">
                        {attempt.score.toFixed(0)}%
                      </span>
                    )}
                    <Badge
                      variant={attempt.passed ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {attempt.passed ? "Passed" : "Failed"}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

