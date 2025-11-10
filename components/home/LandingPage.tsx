import { Suspense } from "react";
import { ShowcaseHeroSpotlight } from "@/components/showcase/ui/HeroVariants";
import { SocialProof } from "./SocialProof";
import { HowItWorks } from "./HowItWorks";
import { Features } from "./Features";
import { Testimonials } from "./Testimonials";
import { FinalCTA } from "./FinalCTA";
import { ThemedSection } from "./ThemedSection";
import { FeaturedQuizzes } from "./FeaturedQuizzes";
import { PopularTopics } from "./PopularTopics";
import { FeaturedQuizzesSkeleton } from "./FeaturedQuizzesSkeleton";
import { PopularTopicsSkeleton } from "./PopularTopicsSkeleton";

interface LandingPageProps {
  stats: {
    totalQuizzes: number;
    activeUsers: number;
    questionsAnswered: number;
    averageRating: number;
  };
}

export function LandingPage({ stats }: LandingPageProps) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <ThemedSection variant="default">
        <div className="px-4 py-12 sm:px-6 sm:py-16 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <ShowcaseHeroSpotlight
              eyebrow="Sports Trivia"
              title="Test Your"
              highlightedText="Sports Knowledge"
              subtitle="Compete with friends, climb the leaderboards, and become a sports trivia champion. Challenge yourself with thousands of questions across all major sports."
              primaryAction={{
                label: "Get Started",
                href: "/auth/signin",
              }}
              secondaryAction={{
                label: "Browse Quizzes",
                href: "/quizzes",
                variant: "secondary",
              }}
              stats={[
                { label: "Quizzes Available", value: stats.totalQuizzes },
                { label: "Active Players", value: stats.activeUsers },
                { label: "Questions Answered", value: stats.questionsAnswered },
                { label: "Average Rating", value: stats.averageRating.toFixed(1) },
              ]}
            />
          </div>
        </div>
      </ThemedSection>

      <ThemedSection variant="vibrant">
        <Suspense fallback={<FeaturedQuizzesSkeleton />}>
          <FeaturedQuizzes />
        </Suspense>
      </ThemedSection>

      <ThemedSection variant="cool">
        <Suspense fallback={<PopularTopicsSkeleton />}>
          <PopularTopics />
        </Suspense>
      </ThemedSection>

      <ThemedSection variant="default">
        <SocialProof stats={stats} />
      </ThemedSection>

      <ThemedSection variant="dark">
        <HowItWorks />
      </ThemedSection>

      <ThemedSection variant="vibrant">
        <Features />
      </ThemedSection>

      <ThemedSection variant="cool">
        <Testimonials />
      </ThemedSection>

      <ThemedSection variant="default">
        <FinalCTA />
      </ThemedSection>
    </div>
  );
}
