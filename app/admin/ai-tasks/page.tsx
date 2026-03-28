import { requireAdmin } from "@/lib/auth-helpers";
import { listBackgroundTasksForUser } from "@/lib/services/background-task.service";
import { PageHeader } from "@/components/shared/PageHeader";
import { AdminAiTasksClient } from "./AdminAiTasksClient";
import { AdminPaginationClient } from "@/components/admin/AdminPaginationClient";
import { prisma } from "@/lib/db";

interface AiTasksPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function AiTasksPage({ searchParams }: AiTasksPageProps) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const page = Math.max(
    1,
    Number(typeof params?.page === "string" ? params.page : "1") || 1
  );
  const limit = Math.min(
    200,
    Math.max(1, Number(typeof params?.limit === "string" ? params.limit : "50") || 50)
  );
  const total = await prisma.adminBackgroundTask.count({ where: { userId: admin.id } });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const skip = (safePage - 1) * limit;

  const tasks = await listBackgroundTasksForUser(admin.id, { take: limit, skip });

  const hasPrevious = safePage > 1;
  const hasNext = safePage < totalPages;

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Background Tasks"
        description="Review AI-generated quizzes and question batches. Tasks leverage durable execution for reliability."
      />

      <AdminAiTasksClient initialTasks={tasks} />

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing{" "}
          <span className="font-medium">
            {tasks.length === 0 ? 0 : skip + 1}-{skip + tasks.length}
          </span>{" "}
          of <span className="font-medium">{total}</span>
        </div>
        <AdminPaginationClient
          currentPage={safePage}
          totalPages={totalPages}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          variant="server"
          filterParams={{ limit: limit.toString() }}
        />
      </div>
    </div>
  );
}
