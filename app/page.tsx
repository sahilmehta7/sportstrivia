import type { Metadata } from "next";
import { Suspense } from "react";
import { LandingPage } from "@/components/home/LandingPage";
import { AuthenticatedPersonalizedHome } from "@/components/home/AuthenticatedPersonalizedHome";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { auth } from "@/lib/auth";
import { isPersonalizedHomeEnabled } from "@/lib/feature-flags";
import { getPersonalizedHomeBucket, getPersonalizedHomeVariantForUser } from "@/lib/personalized-home-experiment";
import { emitPersonalizedHomeExposure } from "@/lib/server-analytics";
import { getPersonalizedHomePayload } from "@/lib/services/personalized-home.service";
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

  const userId = session?.user?.id;
  if (userId) {
    if (!isPersonalizedHomeEnabled()) {
      redirect("/quizzes");
    }

    const bucket = getPersonalizedHomeBucket(userId);
    const variant = getPersonalizedHomeVariantForUser(userId);
    if (variant === "control") {
      await emitPersonalizedHomeExposure({
        userId,
        variant,
        bucket,
        renderedModuleKinds: ["CONTROL_REDIRECT_TO_QUIZZES"],
        renderedRailKinds: [],
      });
      redirect("/quizzes");
    }

    const payload = await getPersonalizedHomePayload(userId);
    const renderedModuleKinds = [
      ...(payload.continuePlaying.length > 0 ? ["CONTINUE_PLAYING"] : []),
      ...(payload.dailyChallenge ? ["DAILY_CHALLENGE"] : []),
      ...payload.rails.map((rail) => `RAIL_${rail.kind}`),
      ...(payload.starterCollections.length > 0 ? ["STARTER_COLLECTIONS"] : []),
    ];
    await emitPersonalizedHomeExposure({
      userId,
      variant,
      bucket,
      renderedModuleKinds,
      renderedRailKinds: payload.rails.map((rail) => rail.kind),
    });
    return <AuthenticatedPersonalizedHome payload={payload} variant={variant} />;
  }

  return (
    <Suspense
      fallback={(
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )}
    >
      <LandingPage stats={stats} />
    </Suspense>
  );
}
