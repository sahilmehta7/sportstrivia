import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AdminDataTable } from "@/components/admin/data-table/AdminDataTable";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  AttemptResetPeriod as AttemptResetPeriodConst,
  ATTEMPT_RESET_PERIOD_LABELS,
} from "@/constants/attempts";

function formatAttemptCap(quiz: {
  maxAttemptsPerUser: number | null;
  attemptResetPeriod: string;
}) {
  if (!quiz.maxAttemptsPerUser) {
    return "Unlimited";
  }

  const pluralSuffix = quiz.maxAttemptsPerUser === 1 ? "" : "s";
  if (quiz.attemptResetPeriod === AttemptResetPeriodConst.NEVER) {
    return `${quiz.maxAttemptsPerUser} attempt${pluralSuffix} total`;
  }

  const periodLabel = ATTEMPT_RESET_PERIOD_LABELS[
    quiz.attemptResetPeriod as keyof typeof ATTEMPT_RESET_PERIOD_LABELS
  ];
  const normalizedLabel = (periodLabel ?? quiz.attemptResetPeriod).toLowerCase();
  return `${quiz.maxAttemptsPerUser} attempt${pluralSuffix} / ${normalizedLabel}`;
}

export default async function QuizzesPage() {
  const quizzes = await prisma.quiz.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          questionPool: true,
          attempts: true,
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Quizzes"
        description="Manage all quizzes"
        action={
          <Link href="/admin/quizzes/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          </Link>
        }
      />

      <AdminDataTable
        headers={[
          { label: "Title" },
          { label: "Sport" },
          { label: "Difficulty" },
          { label: "Status" },
          { label: "Attempt Cap", align: "right" },
          { label: "Questions", align: "right" },
          { label: "Attempts", align: "right" },
          { label: "Actions", align: "right" },
        ]}
        emptyMessage="No quizzes found. Create your first quiz to get started."
        isEmpty={quizzes.length === 0}
      >
        {quizzes.map((quiz) => {
          const resetLabel = ATTEMPT_RESET_PERIOD_LABELS[
            quiz.attemptResetPeriod as keyof typeof ATTEMPT_RESET_PERIOD_LABELS
          ];

          return (
            <TableRow key={quiz.id}>
              <TableCell className="font-medium">
                <div>
                  <div>{quiz.title}</div>
                  <div className="text-sm text-muted-foreground">/{quiz.slug}</div>
                </div>
              </TableCell>
              <TableCell>{quiz.sport || "-"}</TableCell>
              <TableCell>
                <Badge variant="outline">{quiz.difficulty}</Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    quiz.status === "PUBLISHED"
                      ? "default"
                      : quiz.status === "DRAFT"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {quiz.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {quiz.maxAttemptsPerUser ? (
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary">{formatAttemptCap(quiz)}</Badge>
                    {quiz.attemptResetPeriod !== AttemptResetPeriodConst.NEVER && resetLabel && (
                      <span className="text-xs text-muted-foreground">
                        Resets {resetLabel.toLowerCase()}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Unlimited</span>
                )}
              </TableCell>
              <TableCell className="text-right">{quiz._count.questionPool}</TableCell>
              <TableCell className="text-right">{quiz._count.attempts}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Link href={`/admin/quizzes/${quiz.id}/questions`}>
                    <Button variant="ghost" size="sm" title="Manage Questions">
                      Questions ({quiz._count.questionPool})
                    </Button>
                  </Link>
                  <Link href={`/admin/quizzes/${quiz.id}/edit`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </AdminDataTable>
    </div>
  );
}
