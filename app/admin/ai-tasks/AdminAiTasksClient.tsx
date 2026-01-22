"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackgroundTaskStatus, BackgroundTaskType, AdminBackgroundTask } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { RefreshCw, Play, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { retryTask, cancelTask } from "./actions";

// Re-using helper functions logic (copied/adapted for client)
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
            return (type as string).replace(/_/g, " ");
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

interface AdminAiTasksClientProps {
    initialTasks: AdminBackgroundTask[];
}

export function AdminAiTasksClient({ initialTasks }: AdminAiTasksClientProps) {
    const router = useRouter();
    const [tasks, setTasks] = useState(initialTasks);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Sync state with props just in case parent passed new data (Next.js server action refresh)
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        router.refresh(); // Triggers server re-render
        setTimeout(() => setIsRefreshing(false), 1000); // UI feedback delay
    };

    // Auto-refresh if there are pending/in-progress tasks
    useEffect(() => {
        const hasActiveTasks = tasks.some((t) =>
            t.status === BackgroundTaskStatus.IN_PROGRESS ||
            t.status === BackgroundTaskStatus.PENDING
        );

        if (hasActiveTasks) {
            const interval = setInterval(() => {
                router.refresh();
            }, 5000);
            return () => clearInterval(interval);
        }
    }, [tasks, router]);

    // TODO: Add Restart/Cancel actions here communicating with a Server Action
    // For now, these buttons will just be placeholders or link to detail view logic

    return (
        <Card>
            <CardContent className="p-0">
                <div className="p-4 flex justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
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
                                            <span>{new Date(task.createdAt).toLocaleDateString()}</span>
                                            <span className="text-xs text-muted-foreground">{new Date(task.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {/* Simplified date logic for client */}
                                        <span>Updated {new Date(task.updatedAt).toLocaleTimeString()}</span>
                                    </td>
                                    <td className="px-4 py-3 flex gap-2">
                                        <Link href={`/admin/ai-tasks/${task.id}`}>
                                            <Button size="sm" variant="outline" title="Details">
                                                Details
                                            </Button>
                                        </Link>

                                        {(task.status === "FAILED" || task.status === "CANCELLED") && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => retryTask(task.id)}
                                                title="Retry Task"
                                            >
                                                <Play className="h-4 w-4" />
                                            </Button>
                                        )}

                                        {(task.status === "PENDING" || task.status === "IN_PROGRESS") && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => cancelTask(task.id)}
                                                title="Cancel Task"
                                            >
                                                <XCircle className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
