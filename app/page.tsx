import type { Metadata } from "next";
import { Suspense } from "react";
import { ShowcaseThemeProvider } from "@/components/showcase/ShowcaseThemeProvider";
import { LandingPage } from "@/components/home/LandingPage";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Home",
  description: "Test your sports knowledge with thousands of trivia questions. Compete with friends, climb leaderboards, and become a sports trivia champion.",
  keywords: ["sports trivia", "sports quiz", "trivia questions", "sports knowledge", "competitive gaming"],
  openGraph: {
    title: "Sports Trivia - Test Your Sports Knowledge",
    description: "Test your sports knowledge with thousands of trivia questions. Compete with friends, climb leaderboards, and become a sports trivia champion.",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sports Trivia - Test Your Sports Knowledge",
    description: "Test your sports knowledge with thousands of trivia questions. Compete with friends, climb leaderboards, and become a sports trivia champion.",
  },
};

const stats = {
  totalQuizzes: 150,
  activeUsers: 2500,
  questionsAnswered: 50000,
  averageRating: 4.7,
};

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/quizzes");
  }

  return (
    <ShowcaseThemeProvider>
      <Suspense
        fallback={(
          <div className="flex min-h-screen items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}
      >
        <LandingPage stats={stats} />
      </Suspense>
    </ShowcaseThemeProvider>
  );
}
