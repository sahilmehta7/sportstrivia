import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Layers, Sparkles } from "lucide-react";

interface TopicSnapshotCardProps {
  subTopicCount: number;
  questionCount: number;
  funFact?: string;
}

export function TopicSnapshotCard({ subTopicCount, questionCount, funFact }: TopicSnapshotCardProps) {
  return (
    <Card className="border border-border/60 bg-card/90">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Topic Snapshot</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Sub-topics</div>
            <div className="text-lg font-semibold">{subTopicCount}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Questions</div>
            <div className="text-lg font-semibold">{questionCount}</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Fun fact</div>
            <div className="text-sm">{funFact ?? "More topic insights coming soon"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

