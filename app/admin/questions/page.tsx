import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminDataTable } from "@/components/admin/data-table/AdminDataTable";
import { AdminFilterForm } from "@/components/admin/data-table/AdminFilterForm";
import { AdminPaginationClient } from "@/components/admin/AdminPaginationClient";
import { Difficulty, Prisma } from "@prisma/client";
import { TableCell, TableRow } from "@/components/ui/table";
import { Plus, Upload } from "lucide-react";
import Link from "next/link";
import { TopicFilterCombobox } from "@/components/admin/TopicFilterCombobox";
import { DuplicateQuestionButton } from "@/components/admin/questions/DuplicateQuestionButton";

interface QuestionsPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function QuestionsPage({ searchParams }: QuestionsPageProps) {
  const params = await searchParams;
  const search = typeof params?.search === "string" ? params.search : "";
  const topicFilter = typeof params?.topicId === "string" ? params.topicId : "";
  const difficultyFilter =
    typeof params?.difficulty === "string" ? params.difficulty : "";
  const page = Math.max(
    1,
    Number(typeof params?.page === "string" ? params.page : "1") || 1
  );
  const limit = Math.max(
    1,
    Number(typeof params?.limit === "string" ? params.limit : "20") || 20
  );
  const skip = (page - 1) * limit;

  const where: Prisma.QuestionWhereInput = {};

  if (search) {
    where.questionText = { contains: search, mode: "insensitive" };
  }

  if (topicFilter) {
    where.topicId = topicFilter;
  }

  if (difficultyFilter && Object.values(Difficulty).includes(difficultyFilter as Difficulty)) {
    where.difficulty = difficultyFilter as Difficulty;
  }

  const [questions, total, topics] = await Promise.all([
    prisma.question.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
        _count: {
          select: {
            quizPools: true,
            userAnswers: true,
          },
        },
      },
    }),
    prisma.question.count({ where }),
    prisma.topic.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }],
      select: { id: true, name: true, level: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  const filterParams = {
    search: search || undefined,
    topicId: topicFilter || undefined,
    difficulty: difficultyFilter || undefined,
    limit: limit.toString(),
  };

  return (
    <div>
      <PageHeader
        title="Questions"
        description="Manage all questions in the question pool"
        action={
          <div className="flex gap-2">
            <DuplicateQuestionButton />
            <Link href="/admin/questions/import">
              <Button variant="outline">
                <Upload className="h-4 w-4" />
                Import Questions
              </Button>
            </Link>
            <Link href="/admin/questions/new">
              <Button>
                <Plus className="h-4 w-4" />
                Create Question
              </Button>
            </Link>
          </div>
        }
      />

      <AdminFilterForm method="get" action="/admin/questions" className="md:grid-cols-5">
        <input type="hidden" name="page" value="1" />
        <input type="hidden" name="limit" value={limit} />

        <div className="space-y-2">
          <label htmlFor="search" className="text-sm font-medium">
            Search
          </label>
          <Input
            id="search"
            name="search"
            placeholder="Search questions..."
            defaultValue={search}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="topicId" className="text-sm font-medium">
            Topic
          </label>
          <TopicFilterCombobox
            topics={topics}
            defaultValue={topicFilter}
            name="topicId"
            placeholder="Search topics..."
            emptyLabel="All topics"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="difficulty" className="text-sm font-medium">
            Difficulty
          </label>
          <select
            id="difficulty"
            name="difficulty"
            defaultValue={difficultyFilter}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
          >
            <option value="">All difficulties</option>
            <option value={Difficulty.EASY}>Easy</option>
            <option value={Difficulty.MEDIUM}>Medium</option>
            <option value={Difficulty.HARD}>Hard</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <Button type="submit">Apply</Button>
          <Link href="/admin/questions">
            <Button type="button" variant="outline">
              Reset
            </Button>
          </Link>
        </div>
      </AdminFilterForm>

      <AdminDataTable
        headers={[
          { label: "Question" },
          { label: "Topic" },
          { label: "Difficulty" },
          { label: "Type" },
          { label: "Usage", align: "right" },
          { label: "Actions", align: "right" },
        ]}
        emptyMessage="No questions match your filters."
        isEmpty={questions.length === 0}
      >
        {questions.map((question) => (
          <TableRow key={question.id}>
            <TableCell className="max-w-sm">
              <p className="font-medium line-clamp-2">{question.questionText}</p>
            </TableCell>
            <TableCell>
              {question.topic ? (
                <Badge variant="outline">{question.topic.name}</Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{question.difficulty}</Badge>
            </TableCell>
            <TableCell>{question.type}</TableCell>
            <TableCell className="text-right">
              <div className="space-y-1 text-sm">
                <div>{question._count.quizPools} quiz(es)</div>
                <div className="text-muted-foreground">
                  {question._count.userAnswers} answer(s)
                </div>
              </div>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Link href={`/admin/questions/${question.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </AdminDataTable>

      <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing{" "}
          <span className="font-medium">
            {questions.length === 0 ? 0 : skip + 1}-{skip + questions.length}
          </span>{" "}
          of <span className="font-medium">{total}</span>
        </div>
        <AdminPaginationClient
          currentPage={page}
          totalPages={totalPages}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          variant="server"
          filterParams={filterParams}
        />
      </div>
    </div>
  );
}
