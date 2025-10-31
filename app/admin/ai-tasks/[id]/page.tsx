import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  TaskDetailClient,
  SerializedBackgroundTask,
} from "@/components/admin/ai-tasks/TaskDetailClient";

interface AiTaskDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AiTaskDetailPage({ params }: AiTaskDetailPageProps) {
  const { id } = await params;
  const admin = await requireAdmin();
  const task = await prisma.adminBackgroundTask.findUnique({
    where: { id },
  });

  if (!task) {
    notFound();
  }

  if (task.userId && task.userId !== admin.id) {
    notFound();
  }

  const serializedTask: SerializedBackgroundTask = {
    id: task.id,
    label: task.label,
    type: task.type,
    status: task.status,
    createdAt: task.createdAt.toISOString(),
    startedAt: task.startedAt ? task.startedAt.toISOString() : null,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    updatedAt: task.updatedAt.toISOString(),
    errorMessage: task.errorMessage,
    input: task.input ? JSON.parse(JSON.stringify(task.input)) : null,
    result: task.result ? JSON.parse(JSON.stringify(task.result)) : null,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Background Task"
        description="Review generated output and import it into your content library."
      />
      <TaskDetailClient task={serializedTask} />
    </div>
  );
}
