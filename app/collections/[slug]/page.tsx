import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageContainer } from "@/components/shared/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StartCollectionButton } from "@/components/collections/StartCollectionButton";
import { getPublishedCollectionDetail } from "@/lib/services/collection.service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const detail = await getPublishedCollectionDetail(slug);
    return {
      title: detail.seoTitle || `${detail.name} | Collections`,
      description:
        detail.seoDescription ||
        detail.description ||
        "Curated sports trivia collection.",
      alternates: {
        canonical: `/collections/${detail.slug}`,
      },
    };
  } catch {
    return {};
  }
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  let detail: Awaited<ReturnType<typeof getPublishedCollectionDetail>>;
  try {
    detail = await getPublishedCollectionDetail(slug, userId);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen pb-24">
      <PageContainer className="pt-6 md:pt-12">
        <div className="space-y-6">
          <section className="space-y-3">
            <Badge variant="secondary" className="rounded-full">
              {detail.type.replaceAll("_", " ")}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {detail.name}
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
              {detail.description || "Curated quiz journey."}
            </p>
            <StartCollectionButton
              collectionId={detail.id}
              collectionSlug={detail.slug}
              initialNextQuizSlug={detail.progress?.nextQuiz?.slug ?? null}
              isAuthenticated={Boolean(userId)}
            />
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {detail.quizzes.map((item) => (
              <Card key={item.quiz.id} className="border-white/10 bg-white/5">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-base">
                    #{item.order} {item.quiz.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{item.quiz.difficulty}</Badge>
                    {item.quiz.sport ? <Badge variant="outline">{item.quiz.sport}</Badge> : null}
                  </div>
                  <Link
                    href={`/quizzes/${item.quiz.slug}`}
                    className="text-sm font-medium text-primary transition hover:opacity-80"
                  >
                    Open quiz
                  </Link>
                </CardContent>
              </Card>
            ))}
          </section>
        </div>
      </PageContainer>
    </main>
  );
}
