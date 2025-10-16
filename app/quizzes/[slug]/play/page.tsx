import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { QuizPlayClient } from "@/components/quiz/QuizPlayClient";

interface QuizPlayPageProps {
  params: Promise<{ slug: string }>;
}

export default async function QuizPlayPage({ params }: QuizPlayPageProps) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/quizzes/${slug}/play`)}`);
  }

  const quiz = await prisma.quiz.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      status: true,
      isPublished: true,
    },
  });

  if (!quiz || !quiz.isPublished || quiz.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-12 pt-8">
      <QuizPlayClient quizId={quiz.id} quizTitle={quiz.title} quizSlug={slug} />
    </div>
  );
}

