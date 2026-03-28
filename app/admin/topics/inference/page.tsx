import { BackgroundTaskType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/shared/PageHeader";
import { TopicInferenceAdminClient } from "@/components/admin/TopicInferenceAdminClient";
import { listBackgroundTasksForUser } from "@/lib/services/background-task.service";
import { AdminPaginationClient } from "@/components/admin/AdminPaginationClient";
import { prisma } from "@/lib/db";

interface TopicInferencePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TopicInferencePage({ searchParams }: TopicInferencePageProps) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const page = Math.max(
    1,
    Number(typeof params?.page === "string" ? params.page : "1") || 1
  );
  const limit = Math.min(
    100,
    Math.max(1, Number(typeof params?.limit === "string" ? params.limit : "25") || 25)
  );
  const types = [
    BackgroundTaskType.TOPIC_RELATION_INFERENCE,
    BackgroundTaskType.TOPIC_TYPE_AUDIT,
    BackgroundTaskType.TOPIC_TYPE_APPLY,
  ];
  const total = await prisma.adminBackgroundTask.count({
    where: {
      userId: admin.id,
      type: { in: types },
    },
  });
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const skip = (safePage - 1) * limit;

  const [tasks, latestAuditTask] = await Promise.all([
    listBackgroundTasksForUser(admin.id, {
      types,
      take: limit,
      skip,
      includeResult: true,
    }),
    prisma.adminBackgroundTask.findFirst({
      where: {
        userId: admin.id,
        type: BackgroundTaskType.TOPIC_TYPE_AUDIT,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const hasPrevious = safePage > 1;
  const hasNext = safePage < totalPages;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Topic Inference"
        description="Run hierarchy inference, download audit reports, and review AI topic-type suggestions."
      />
      <TopicInferenceAdminClient
        initialTasks={tasks.map((task) => ({
          id: task.id,
          label: task.label,
          type: task.type,
          status: task.status,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          input: task.input as Record<string, unknown> | null,
          result: task.result as Record<string, unknown> | null,
        }))}
        latestAuditTask={
          latestAuditTask
            ? {
                id: latestAuditTask.id,
                label: latestAuditTask.label,
                type: latestAuditTask.type,
                status: latestAuditTask.status,
                createdAt: latestAuditTask.createdAt.toISOString(),
                updatedAt: latestAuditTask.updatedAt.toISOString(),
                input: latestAuditTask.input as Record<string, unknown> | null,
                result: latestAuditTask.result as Record<string, unknown> | null,
              }
            : null
        }
      />
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
