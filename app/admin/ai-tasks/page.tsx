import { requireAdmin } from "@/lib/auth-helpers";
import { listBackgroundTasksForUser } from "@/lib/services/background-task.service";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminAiTasksClient } from "./AdminAiTasksClient";

export default async function AiTasksPage() {
  const admin = await requireAdmin();
  // Limit to 50 tasks per page to avoid connection pool issues with large JSON fields
  // The result field is excluded by default in listBackgroundTasksForUser
  const tasks = await listBackgroundTasksForUser(admin.id, { take: 50 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Background Tasks"
        description="Review AI-generated quizzes and question batches. Tasks leverage durable execution for reliability."
      />

      <AdminAiTasksClient initialTasks={tasks} />
    </div>
  );
}

