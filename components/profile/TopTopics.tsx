import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { glassText } from "@/components/showcase/ui/typography";

interface TopicStat {
  id: string;
  topic: {
    id: string;
    name: string;
    slug: string;
  };
  questionsAnswered: number;
  questionsCorrect: number;
  successRate: number;
}

interface TopTopicsProps {
  topics: TopicStat[];
}

export function TopTopics({ topics }: TopTopicsProps) {
  return (
    <Card className="relative overflow-hidden rounded-[2rem] border shadow-xl bg-card/80 backdrop-blur-lg border-border/60">
      {/* Background blur circles */}
      <div className="absolute -top-20 -right-14 h-56 w-56 rounded-full bg-orange-500/20 blur-[160px]" />
      <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-blue-500/15 blur-[160px]" />
      
      <CardHeader className="relative">
        <CardTitle className={cn("flex items-center gap-2", glassText.h2)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-orange-500/30 to-pink-500/30">
            <Target className="h-4 w-4 text-orange-100" />
          </div>
          Top Topics
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        {topics.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className={cn("text-sm", glassText.subtitle)}>
              No topic stats yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {topics.map((stat) => (
              <Link
                key={stat.id}
                href={`/topics/${stat.topic.slug}`}
                className="block"
              >
                <div className="group relative overflow-hidden rounded-[1.5rem] border border-border/40 bg-muted/30 p-4 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:bg-muted/50">
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 transition-opacity group-hover:opacity-100" />
                  
                  <div className="relative space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={cn("font-medium", glassText.h3)}>{stat.topic.name}</span>
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        <span className={cn("text-sm font-semibold text-primary", glassText.badge)}>
                          {stat.successRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <Progress value={stat.successRate} className="h-2 rounded-full" />
                    <p className={cn("text-xs", glassText.subtitle)}>
                      {stat.questionsCorrect} / {stat.questionsAnswered} correct
                    </p>
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

