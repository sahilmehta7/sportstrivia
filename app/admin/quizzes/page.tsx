import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AdminDataTable } from "@/components/admin/data-table/AdminDataTable";
import { TableCell, TableRow } from "@/components/ui/table";

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
          { label: "Questions", align: "right" },
          { label: "Attempts", align: "right" },
          { label: "Actions", align: "right" },
        ]}
        emptyMessage="No quizzes found. Create your first quiz to get started."
        isEmpty={quizzes.length === 0}
      >
        {quizzes.map((quiz) => (
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
        ))}
      </AdminDataTable>
    </div>
  );
}
