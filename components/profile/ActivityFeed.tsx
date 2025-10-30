import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, XCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { glassText } from "@/components/showcase/ui/typography";

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
    <Card className="relative overflow-hidden rounded-[2rem] border shadow-xl bg-card/80 backdrop-blur-lg border-border/60">
      {/* Background blur circles */}
      <div className="absolute -top-20 -right-14 h-56 w-56 rounded-full bg-orange-500/20 blur-[160px]" />
      <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-blue-500/15 blur-[160px]" />
      
      <CardHeader className="relative">
        <CardTitle className={cn("flex items-center gap-2", glassText.h2)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-500/30 to-pink-500/30">
            <Clock className="h-4 w-4 text-orange-100" />
          </div>
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        {attempts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className={cn("text-sm", glassText.subtitle)}>
              No quiz attempts yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((attempt) => (
              <Link
                key={attempt.id}
                href={`/quizzes/${attempt.quiz.slug}`}
                className="block"
              >
                <div className="group relative overflow-hidden rounded-[1.5rem] border border-border/40 bg-muted/30 p-4 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:bg-muted/50">
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 transition-opacity group-hover:opacity-100" />
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-500/30 to-pink-500/30">
                        {attempt.passed ? (
                          <CheckCircle2 className="h-4 w-4 text-green-100" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-100" />
                        )}
                      </div>
                      <div>
                        <p className={cn("font-medium", glassText.h3)}>{attempt.quiz.title}</p>
                        <p className={cn("text-xs", glassText.subtitle)}>
                          {formatDate(attempt.completedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {attempt.score !== null && (
                        <div className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span className={cn("text-sm font-semibold", glassText.badge)}>
                            {attempt.score.toFixed(0)}%
                          </span>
                        </div>
                      )}
                      <Badge
                        variant={attempt.passed ? "default" : "secondary"}
                        className={cn(
                          "text-xs rounded-full",
                          attempt.passed 
                            ? "bg-green-500/20 text-green-100 border-green-500/30" 
                            : "bg-red-500/20 text-red-100 border-red-500/30"
                        )}
                      >
                        {attempt.passed ? "Passed" : "Failed"}
                      </Badge>
                    </div>
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

