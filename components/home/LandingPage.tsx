"use client";

import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getBackgroundVariant, getBlurCircles } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { ShowcaseHeroSpotlight } from "@/components/showcase/ui/HeroVariants";
import { FeaturedQuizzes } from "./FeaturedQuizzes";
import { PopularTopics } from "./PopularTopics";
import { SocialProof } from "./SocialProof";
import { HowItWorks } from "./HowItWorks";
import { Features } from "./Features";
import { Testimonials } from "./Testimonials";
import { FinalCTA } from "./FinalCTA";

interface LandingPageProps {
  featuredQuizzes: any[];
  topTopics: any[];
  stats: {
    totalQuizzes: number;
    activeUsers: number;
    questionsAnswered: number;
    averageRating: number;
  };
}

export function LandingPage({ featuredQuizzes, topTopics: _topTopics, stats }: LandingPageProps) {
  const { theme } = useShowcaseTheme();
  const blurCircles = getBlurCircles(theme);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Hero Section with default background */}
      <div className={cn(
        "relative",
        getBackgroundVariant("default", theme)
      )}>
        {/* Animated blur circles */}
        <div className="absolute inset-0 -z-10 opacity-70">
          <div className={cn(`absolute -left-20 top-24 h-72 w-72 rounded-full blur-[120px]`, blurCircles.circle1)} />
          <div className={cn(`absolute right-12 top-12 h-64 w-64 rounded-full blur-[100px]`, blurCircles.circle2)} />
          <div className={cn(`absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-[90px]`, blurCircles.circle3)} />
        </div>
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
      </div>

      {/* Featured Quizzes with vibrant background */}
      <div className={cn("relative", getBackgroundVariant("vibrant", theme))}>
        {/* Animated blur circles */}
        <div className="absolute inset-0 -z-10 opacity-70">
          <div className={cn(`absolute -left-20 top-24 h-72 w-72 rounded-full blur-[120px]`, blurCircles.circle1)} />
          <div className={cn(`absolute right-12 top-12 h-64 w-64 rounded-full blur-[100px]`, blurCircles.circle2)} />
          <div className={cn(`absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-[90px]`, blurCircles.circle3)} />
        </div>
        <FeaturedQuizzes quizzes={featuredQuizzes} />
      </div>

      {/* Popular Topics with cool background */}
      <div className={cn("relative", getBackgroundVariant("cool", theme))}>
        {/* Animated blur circles */}
        <div className="absolute inset-0 -z-10 opacity-70">
          <div className={cn(`absolute -left-20 top-24 h-72 w-72 rounded-full blur-[120px]`, blurCircles.circle1)} />
          <div className={cn(`absolute right-12 top-12 h-64 w-64 rounded-full blur-[100px]`, blurCircles.circle2)} />
          <div className={cn(`absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-[90px]`, blurCircles.circle3)} />
        </div>
        <PopularTopics />
      </div>

      {/* Social Proof with default background */}
      <div className={cn("relative", getBackgroundVariant("default", theme))}>
        {/* Animated blur circles */}
        <div className="absolute inset-0 -z-10 opacity-70">
          <div className={cn(`absolute -left-20 top-24 h-72 w-72 rounded-full blur-[120px]`, blurCircles.circle1)} />
          <div className={cn(`absolute right-12 top-12 h-64 w-64 rounded-full blur-[100px]`, blurCircles.circle2)} />
          <div className={cn(`absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-[90px]`, blurCircles.circle3)} />
        </div>
        <SocialProof stats={stats} />
      </div>

      {/* How It Works with dark background */}
      <div className={cn("relative", getBackgroundVariant("dark", theme))}>
        {/* Animated blur circles */}
        <div className="absolute inset-0 -z-10 opacity-70">
          <div className={cn(`absolute -left-20 top-24 h-72 w-72 rounded-full blur-[120px]`, blurCircles.circle1)} />
          <div className={cn(`absolute right-12 top-12 h-64 w-64 rounded-full blur-[100px]`, blurCircles.circle2)} />
          <div className={cn(`absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-[90px]`, blurCircles.circle3)} />
        </div>
        <HowItWorks />
      </div>

      {/* Features with vibrant background */}
      <div className={cn("relative", getBackgroundVariant("vibrant", theme))}>
        {/* Animated blur circles */}
        <div className="absolute inset-0 -z-10 opacity-70">
          <div className={cn(`absolute -left-20 top-24 h-72 w-72 rounded-full blur-[120px]`, blurCircles.circle1)} />
          <div className={cn(`absolute right-12 top-12 h-64 w-64 rounded-full blur-[100px]`, blurCircles.circle2)} />
          <div className={cn(`absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-[90px]`, blurCircles.circle3)} />
        </div>
        <Features />
      </div>

      {/* Testimonials with cool background */}
      <div className={cn("relative", getBackgroundVariant("cool", theme))}>
        {/* Animated blur circles */}
        <div className="absolute inset-0 -z-10 opacity-70">
          <div className={cn(`absolute -left-20 top-24 h-72 w-72 rounded-full blur-[120px]`, blurCircles.circle1)} />
          <div className={cn(`absolute right-12 top-12 h-64 w-64 rounded-full blur-[100px]`, blurCircles.circle2)} />
          <div className={cn(`absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-[90px]`, blurCircles.circle3)} />
        </div>
        <Testimonials />
      </div>

      {/* Final CTA with default background */}
      <div className={cn("relative", getBackgroundVariant("default", theme))}>
        {/* Animated blur circles */}
        <div className="absolute inset-0 -z-10 opacity-70">
          <div className={cn(`absolute -left-20 top-24 h-72 w-72 rounded-full blur-[120px]`, blurCircles.circle1)} />
          <div className={cn(`absolute right-12 top-12 h-64 w-64 rounded-full blur-[100px]`, blurCircles.circle2)} />
          <div className={cn(`absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-[90px]`, blurCircles.circle3)} />
        </div>
        <FinalCTA />
      </div>
    </div>
  );
}
