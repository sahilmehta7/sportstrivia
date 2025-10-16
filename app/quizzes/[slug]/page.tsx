import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { generateQuizMetaTags } from "@/lib/seo-utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StartQuizButton } from "./start-quiz-button";

interface QuizDetailPageProps {
  params: Promise<{ slug: string }>;
}

function formatDuration(seconds?: number | null) {
  if (!seconds) {
    return "Flexible";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (!minutes) {
    return `${remainingSeconds} sec`;
  }

  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${remainingSeconds} sec`;
}

function formatDateTime(date?: Date | null) {
  if (!date) {
    return "No schedule";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export async function generateMetadata({
  params,
}: QuizDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { slug },
    select: {
      title: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      seoKeywords: true,
      sport: true,
      difficulty: true,
      descriptionImageUrl: true,
      slug: true,
      isPublished: true,
      status: true,
    },
  });

  if (!quiz || !quiz.isPublished || quiz.status !== "PUBLISHED") {
    return {
      title: "Quiz not found | Sports Trivia",
      description: "The requested quiz could not be found.",
    };
  }

  const meta = generateQuizMetaTags(quiz);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const canonicalUrl = baseUrl ? `${baseUrl}/quizzes/${quiz.slug}` : undefined;

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: meta.ogTitle,
      description: meta.ogDescription,
      type: "article",
      ...(canonicalUrl ? { url: canonicalUrl } : {}),
      ...(quiz.descriptionImageUrl
        ? { images: [{ url: quiz.descriptionImageUrl }] }
        : {}),
    },
    twitter: {
      card: quiz.descriptionImageUrl ? "summary_large_image" : "summary",
      title: meta.ogTitle,
      description: meta.ogDescription,
      ...(quiz.descriptionImageUrl
        ? { images: [quiz.descriptionImageUrl] }
        : {}),
    },
    ...(canonicalUrl
      ? {
          alternates: {
            canonical: canonicalUrl,
          },
        }
      : {}),
  };
}

export default async function QuizDetailPage({
  params,
}: QuizDetailPageProps) {
  const { slug } = await params;
  const [session, quiz] = await Promise.all([
    auth(),
    prisma.quiz.findUnique({
      where: { slug },
      include: {
        tags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            questionPool: true,
            attempts: true,
            reviews: true,
          },
        },
      },
    }),
  ]);

  if (!quiz || !quiz.isPublished || quiz.status !== "PUBLISHED") {
    notFound();
  }

  const isLoggedIn = Boolean(session?.user);
  const now = new Date();
  const hasStarted = !quiz.startTime || quiz.startTime <= now;
  const hasEnded = Boolean(quiz.endTime && quiz.endTime < now);
  const isLive = hasStarted && !hasEnded;

  let availabilityStatus: "upcoming" | "live" | "ended" = "live";
  let availabilityMessage = "This quiz is live and ready to play.";

  if (hasEnded) {
    availabilityStatus = "ended";
    availabilityMessage = `This quiz ended on ${formatDateTime(quiz.endTime)}.`;
  } else if (!hasStarted) {
    availabilityStatus = "upcoming";
    availabilityMessage = `This quiz will be available on ${formatDateTime(quiz.startTime)}.`;
  }

  const tags = quiz.tags.map((relation) => relation.tag);
  const questionModeLabel = quiz.questionSelectionMode
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-muted/30 py-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {quiz.sport && <Badge variant="outline">{quiz.sport}</Badge>}
            <Badge variant="secondary">{quiz.difficulty}</Badge>
            {tags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="capitalize">
                {tag.name}
              </Badge>
            ))}
          </div>

          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
                {quiz.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {isLoggedIn ? (
              <StartQuizButton quizId={quiz.id} disabled={!isLive} />
            ) : (
              <Link href="/auth/signin">
                <Button size="lg">Sign up to play</Button>
              </Link>
            )}
            <Badge
              variant={
                availabilityStatus === "live"
                  ? "default"
                  : availabilityStatus === "upcoming"
                    ? "secondary"
                    : "destructive"
              }
            >
              {availabilityStatus === "live"
                ? "Live now"
                : availabilityStatus === "upcoming"
                  ? "Upcoming"
                  : "Closed"}
            </Badge>
            <p className="text-sm text-muted-foreground">{availabilityMessage}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-12 lg:flex-row">
        <div className="flex-1 space-y-8">
          {quiz.descriptionImageUrl && (
            <div className="overflow-hidden rounded-lg border bg-card">
              <Image
                src={quiz.descriptionImageUrl}
                alt={`${quiz.title} cover image`}
                width={960}
                height={540}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          )}

          <Card>
            <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-lg font-semibold">
                  {formatDuration(quiz.duration)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Questions</p>
                <p className="text-lg font-semibold">
                  {quiz._count.questionPool} total questions
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Passing Score</p>
                <p className="text-lg font-semibold">{quiz.passingScore}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Question Mode</p>
                <p className="text-lg font-semibold">{questionModeLabel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hints</p>
                <p className="text-lg font-semibold">
                  {quiz.showHints ? "Enabled" : "Disabled"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Negative Marking</p>
                <p className="text-lg font-semibold">
                  {quiz.negativeMarkingEnabled
                    ? `Yes (-${quiz.penaltyPercentage}% per miss)`
                    : "No"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-xl font-semibold">How scoring works</h2>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>
                  Earn points for each correct answer and aim for at least {quiz.passingScore}% to pass.
                </li>
                {quiz.negativeMarkingEnabled && (
                  <li>
                    Incorrect answers reduce your score by {quiz.penaltyPercentage}% of the question value.
                  </li>
                )}
                {quiz.timeBonusEnabled ? (
                  <li>
                    Save time to earn bonus points ({quiz.bonusPointsPerSecond} per second remaining).
                  </li>
                ) : (
                  <li>
                    Focus on accuracy—there are no time-based bonus points for this quiz.
                  </li>
                )}
                {quiz.timePerQuestion ? (
                  <li>
                    You have {formatDuration(quiz.timePerQuestion)} for each question.
                  </li>
                ) : (
                  <li>
                    Manage your total time of {formatDuration(quiz.duration)} wisely.
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        <aside className="w-full space-y-6 lg:w-80">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-xl font-semibold">Schedule</h2>
              <div>
                <p className="text-sm text-muted-foreground">Opens</p>
                <p className="font-medium">
                  {quiz.startTime ? formatDateTime(quiz.startTime) : "Available now"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Closes</p>
                <p className="font-medium">
                  {quiz.endTime ? formatDateTime(quiz.endTime) : "No end date"}
                </p>
              </div>
              {!isLoggedIn && (
                <p className="text-sm text-muted-foreground">
                  Create a free account to save your attempts and compete on the leaderboard.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-xl font-semibold">Community stats</h2>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total attempts</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("en-US").format(quiz._count.attempts)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Average rating</span>
                <span className="font-medium">
                  {quiz.totalReviews > 0
                    ? quiz.averageRating.toFixed(1)
                    : "Not rated"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reviews</span>
                <span className="font-medium">{quiz._count.reviews}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
