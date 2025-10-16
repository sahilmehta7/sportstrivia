import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, Users, Trophy, TrendingUp } from "lucide-react";

export default async function AdminDashboard() {
  // Get statistics
  const [totalUsers, totalQuizzes, totalQuestions, totalAttempts, recentQuizzes] =
    await Promise.all([
      prisma.user.count(),
      prisma.quiz.count({ where: { isPublished: true } }),
      prisma.question.count(),
      prisma.quizAttempt.count({ where: { completedAt: { not: null } } }),
      prisma.quiz.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              attempts: true,
              questionPool: true,
            },
          },
        },
      }),
    ]);

  // Calculate completion rate
  const totalStarted = await prisma.quizAttempt.count();
  const completionRate = totalStarted > 0 ? (totalAttempts / totalStarted) * 100 : 0;

  const stats = [
    {
      title: "Total Users",
      value: totalUsers.toLocaleString(),
      icon: Users,
      description: "Registered users",
    },
    {
      title: "Published Quizzes",
      value: totalQuizzes.toLocaleString(),
      icon: FileQuestion,
      description: "Available quizzes",
    },
    {
      title: "Total Questions",
      value: totalQuestions.toLocaleString(),
      icon: Trophy,
      description: "Question pool",
    },
    {
      title: "Completion Rate",
      value: `${completionRate.toFixed(1)}%`,
      icon: TrendingUp,
      description: `${totalAttempts} completed`,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your sports trivia platform"
      />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Quizzes */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Created Quizzes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <h3 className="font-medium">{quiz.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {quiz._count.questionPool} questions •{" "}
                    {quiz._count.attempts} attempts
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium capitalize">
                    {quiz.status.toLowerCase()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {quiz.difficulty}
                  </div>
                </div>
              </div>
            ))}
            {recentQuizzes.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No quizzes created yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

