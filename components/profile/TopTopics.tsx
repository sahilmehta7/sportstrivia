import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import Link from "next/link";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Top Topics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topics.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No topic stats yet
          </p>
        ) : (
          <div className="space-y-4">
            {topics.map((stat) => (
              <Link
                key={stat.id}
                href={`/topics/${stat.topic.slug}`}
                className="block"
              >
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{stat.topic.name}</span>
                    <span className="text-sm font-semibold text-primary">
                      {stat.successRate.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={stat.successRate} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {stat.questionsCorrect} / {stat.questionsAnswered} correct
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

