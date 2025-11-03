import { requireAdmin } from "@/lib/auth-helpers";
import { listBackgroundTasksForUser } from "@/lib/services/background-task.service";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { History } from "lucide-react";
import { BackgroundTaskStatus, BackgroundTaskType } from "@prisma/client";

function formatTaskType(type: BackgroundTaskType): string {
  switch (type) {
    case BackgroundTaskType.AI_QUIZ_GENERATION:
      return "AI Quiz Generation";
    case BackgroundTaskType.AI_TOPIC_QUESTION_GENERATION:
      return "AI Question Generation";
    case BackgroundTaskType.AI_QUIZ_IMPORT:
      return "AI Quiz Import";
    case BackgroundTaskType.AI_TOPIC_QUESTION_IMPORT:
      return "AI Question Import";
    default:
      return type.replace(/_/g, " ");
  }
}

function statusVariant(status: BackgroundTaskStatus): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case BackgroundTaskStatus.COMPLETED:
      return "default";
    case BackgroundTaskStatus.IN_PROGRESS:
      return "secondary";
    case BackgroundTaskStatus.PENDING:
      return "outline";
    case BackgroundTaskStatus.CANCELLED:
    case BackgroundTaskStatus.FAILED:
      return "destructive";
    default:
      return "secondary";
  }
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatRelative(date: Date | null): string {
  if (!date) return "";
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default async function AiTasksPage() {
  const admin = await requireAdmin();
  // Limit to 50 tasks per page to avoid connection pool issues with large JSON fields
  // The result field is excluded by default in listBackgroundTasksForUser
  const tasks = await listBackgroundTasksForUser(admin.id, { take: 50 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Background Tasks"
        description="Review AI-generated quizzes and question batches saved for later review."
        icon={<History className="h-8 w-8" />}
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border/60 text-sm">
              <thead className="bg-muted/40">
                <tr className="text-muted-foreground">
                  <th className="px-4 py-3 text-left font-semibold">Task</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Created</th>
                  <th className="px-4 py-3 text-left font-semibold">Updated</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {tasks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No AI background tasks yet. Generate a quiz or question set to see it here.
                    </td>
                  </tr>
                )}
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-foreground">{task.label}</span>
                        <span className="text-xs text-muted-foreground">{formatTaskType(task.type)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(task.status)}>{task.status.replace(/_/g, " ")}</Badge>
                      {task.errorMessage && (
                        <div className="mt-1 text-xs text-destructive">{task.errorMessage}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span>{formatDate(task.createdAt)}</span>
                        <span className="text-xs text-muted-foreground">{formatRelative(task.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span>{formatDate(task.completedAt ?? task.updatedAt ?? task.startedAt ?? task.createdAt)}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatRelative(task.completedAt ?? task.updatedAt ?? task.startedAt ?? task.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/ai-tasks/${task.id}`}>
                        <Button size="sm" variant="outline">
                          View details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
