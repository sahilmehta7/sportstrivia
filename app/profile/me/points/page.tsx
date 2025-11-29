import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { glassText } from "@/components/showcase/ui/typography";
import { PointsPaginationClient } from "@/components/profile/PointsPaginationClient";
import { PageContainer } from "@/components/shared/PageContainer";

const PAGE_SIZE = 20;

export default async function PointsHistoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;
  const sp = await searchParams;
  const pageParam = Array.isArray(sp?.page) ? sp?.page[0] : sp?.page;
  const page = Math.max(1, Number(pageParam) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [attempts, total] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
      skip,
      take: PAGE_SIZE,
      select: {
        id: true,
        totalPoints: true,
        completedAt: true,
        quiz: { select: { title: true, slug: true } },
      },
    }),
    prisma.quizAttempt.count({ where: { userId, completedAt: { not: null } } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="relative min-h-screen bg-background py-8">
      {/* Background blur circles */}
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute right-12 top-12 h-64 w-64 rounded-full bg-emerald-500/20 blur-[100px]" />
        <div className="absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-purple-500/20 blur-[90px]" />
      </div>

      <PageContainer className="relative">
        <PageHeader title="Points History" description="Your recent points transactions" />

        <Card className="relative mt-6 overflow-hidden rounded-[2rem] border shadow-xl bg-card/80 backdrop-blur-lg border-border/60">
          {/* Subtle gradient overlay */}
          <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-orange-500/20 blur-[160px]" />
          <div className="absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-blue-500/15 blur-[160px]" />

          <CardHeader className="relative">
            <CardTitle className={cn("flex items-center gap-2", glassText.h2)}>
              Transactions
            </CardTitle>
            <p className={cn("mt-1 text-sm", glassText.subtitle)}>
              Showing {(total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1)}–
              {Math.min(total, page * PAGE_SIZE)} of {total}
            </p>
          </CardHeader>
          <CardContent className="relative">
            {attempts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Quiz</th>
                      <th className="py-2 pl-4 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a) => (
                      <tr key={a.id} className="border-t/50">
                        <td className="py-3 pr-4 align-middle">
                          {a.completedAt
                            ? new Intl.DateTimeFormat("en-US", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(a.completedAt)
                            : "—"}
                        </td>
                        <td className="py-3 pr-4 align-middle">
                          {a.quiz ? (
                            <Link href={`/quizzes/${a.quiz.slug}/results/${a.id}`} className={cn("underline", glassText.subtitle)}>
                              {a.quiz.title}
                            </Link>
                          ) : (
                            <span className={cn(glassText.subtitle)}>Quiz</span>
                          )}
                        </td>
                        <td className="py-3 pl-4 pr-0 text-right align-middle">
                          <span className="inline-flex items-center justify-end rounded-xl border border-border/60 bg-background/60 px-3 py-1 font-semibold text-green-600 backdrop-blur-sm dark:text-green-400">
                            +{(a.totalPoints || 0).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pages > 1 && (
              <div className="mt-6 flex items-center justify-center">
                <PointsPaginationClient page={page} pages={pages} />
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </main>
  );
}


