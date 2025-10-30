import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AdminDataTable } from "@/components/admin/data-table/AdminDataTable";
import { AdminFilterForm } from "@/components/admin/data-table/AdminFilterForm";
import { FeaturedToggleButton } from "@/components/admin/FeaturedToggleButton";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  AttemptResetPeriod as AttemptResetPeriodConst,
  ATTEMPT_RESET_PERIOD_LABELS,
} from "@/constants/attempts";
import { Difficulty, QuizStatus, RecurringType, Prisma } from "@prisma/client";

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

interface QuizzesPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function QuizzesPage({ searchParams }: QuizzesPageProps) {
  const params = await searchParams;
  const search = typeof params?.search === "string" ? params.search : "";
  const topicFilter = typeof params?.topicId === "string" ? params.topicId : "";
  const difficultyFilter = typeof params?.difficulty === "string" ? params.difficulty : "";
  const statusFilter = typeof params?.status === "string" ? params.status : "";
  const sportFilter = typeof params?.sport === "string" ? params.sport : "";
  const featuredFilter = typeof params?.featured === "string" ? params.featured : "";
  const recurringFilter = typeof params?.recurringType === "string" ? params.recurringType : "";

  const where: Prisma.QuizWhereInput = {};

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  if (topicFilter) {
    where.topicConfigs = {
      some: {
        topicId: topicFilter,
      },
    };
  }

  if (difficultyFilter && Object.values(Difficulty).includes(difficultyFilter as Difficulty)) {
    where.difficulty = difficultyFilter as Difficulty;
  }

  if (statusFilter && Object.values(QuizStatus).includes(statusFilter as QuizStatus)) {
    where.status = statusFilter as QuizStatus;
  }

  if (sportFilter) {
    where.sport = sportFilter;
  }

  if (featuredFilter) {
    if (featuredFilter === "true") {
      where.isFeatured = true;
    } else if (featuredFilter === "false") {
      where.isFeatured = false;
    }
  }

  if (recurringFilter && Object.values(RecurringType).includes(recurringFilter as RecurringType)) {
    where.recurringType = recurringFilter as RecurringType;
  }

  // Fetch data in parallel
  const [quizzes, topics, sports] = await Promise.all([
    prisma.quiz.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            questionPool: true,
            attempts: true,
          },
        },
        topicConfigs: {
          select: {
            topic: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),
    prisma.topic.findMany({
      orderBy: [{ level: "asc" }, { name: "asc" }],
      select: { id: true, name: true, level: true },
    }),
    prisma.quiz.findMany({
      select: { sport: true },
      distinct: ["sport"],
      where: { sport: { not: null } },
      orderBy: { sport: "asc" },
    }),
  ]);

  const uniqueSports: string[] = Array.from(
    new Set(sports.map((s) => s.sport).filter(Boolean))
  ) as string[];

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

      {/* Search Bar */}
      <div className="mb-6">
        <form method="get" action="/admin/quizzes" className="flex gap-2">
          <div className="flex-1 space-y-2">
            <label htmlFor="search" className="text-sm font-medium">
              Search Quizzes
            </label>
            <Input
              id="search"
              name="search"
              placeholder="Search by title, description, or slug..."
              defaultValue={search}
            />
          </div>
          <input type="hidden" name="topicId" value={topicFilter} />
          <input type="hidden" name="difficulty" value={difficultyFilter} />
          <input type="hidden" name="status" value={statusFilter} />
          <input type="hidden" name="sport" value={sportFilter} />
          <input type="hidden" name="featured" value={featuredFilter} />
          <input type="hidden" name="recurringType" value={recurringFilter} />
          <div className="flex items-end gap-2">
            <Button type="submit">Search</Button>
            {search && (
              <Link href="/admin/quizzes">
                <Button type="button" variant="outline">
                  Clear
                </Button>
              </Link>
            )}
          </div>
        </form>
      </div>

      <AdminFilterForm method="get" action="/admin/quizzes" className="md:grid-cols-4">
        <input type="hidden" name="search" value={search} />

        <div className="space-y-2">
          <label htmlFor="topicId" className="text-sm font-medium">
            Topic
          </label>
          <select
            id="topicId"
            name="topicId"
            defaultValue={topicFilter}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
          >
            <option value="">All topics</option>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {`${"— ".repeat(topic.level ?? 0)}${topic.name}`}
              </option>
            ))}
          </select>
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
          <Link href="/admin/quizzes">
            <Button type="button" variant="outline">
              Reset
            </Button>
          </Link>
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={statusFilter}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
          >
            <option value="">All statuses</option>
            <option value={QuizStatus.PUBLISHED}>Published</option>
            <option value={QuizStatus.DRAFT}>Draft</option>
            <option value={QuizStatus.ARCHIVED}>Archived</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="sport" className="text-sm font-medium">
            Sport
          </label>
          <select
            id="sport"
            name="sport"
            defaultValue={sportFilter}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
          >
            <option value="">All sports</option>
            {uniqueSports.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="featured" className="text-sm font-medium">
            Featured
          </label>
          <select
            id="featured"
            name="featured"
            defaultValue={featuredFilter}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
          >
            <option value="">All quizzes</option>
            <option value="true">Featured only</option>
            <option value="false">Not featured</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="recurringType" className="text-sm font-medium">
            Recurring Type
          </label>
          <select
            id="recurringType"
            name="recurringType"
            defaultValue={recurringFilter}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm"
          >
            <option value="">All types</option>
            <option value={RecurringType.NONE}>None</option>
            <option value={RecurringType.DAILY}>Daily</option>
            <option value={RecurringType.WEEKLY}>Weekly</option>
            {/* Monthly not available in current RecurringType */}
          </select>
        </div>
      </AdminFilterForm>

      <AdminDataTable
        headers={[
          { label: "Title" },
          { label: "Topics" },
          { label: "Sport" },
          { label: "Difficulty" },
          { label: "Status" },
          { label: "Attempt Cap", align: "right" },
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
                <span>{quiz.title}</span>
              </TableCell>
              <TableCell>
                {quiz.topicConfigs.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {Array.from(
                      new Map(quiz.topicConfigs.map((config) => [config.topic.id, config])).values()
                    ).map((config) => (
                      <Badge key={`${quiz.id}-${config.topic.id}`} variant="outline" className="text-xs">
                        {config.topic.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
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
              <TableCell className="text-right">{quiz._count.attempts}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <FeaturedToggleButton quizId={quiz.id} isFeatured={quiz.isFeatured} />
                  <Link href={`/admin/quizzes/${quiz.id}/questions`}>
                    <Button variant="ghost" size="sm" title={`Manage Questions (${quiz._count.questionPool})`}>
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/admin/quizzes/${quiz.id}/edit`}>
                    <Button variant="ghost" size="sm" title="Edit Quiz">
                      <Edit className="h-4 w-4" />
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
