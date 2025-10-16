import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Sport</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Questions</TableHead>
              <TableHead className="text-right">Attempts</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.map((quiz) => (
              <TableRow key={quiz.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{quiz.title}</div>
                    <div className="text-sm text-muted-foreground">
                      /{quiz.slug}
                    </div>
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
                  {quiz._count.questionPool}
                </TableCell>
                <TableCell className="text-right">
                  {quiz._count.attempts}
                </TableCell>
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
            {quizzes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-muted-foreground">
                    No quizzes found. Create your first quiz to get started.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

