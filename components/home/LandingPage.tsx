"use client";

import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getBackgroundVariant, getBlurCircles } from "@/lib/showcase-theme";
import { cn } from "@/lib/utils";
import { HeroSection } from "./HeroSection";
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

export function LandingPage({ featuredQuizzes, topTopics, stats }: LandingPageProps) {
  const { theme } = useShowcaseTheme();
  const blurCircles = getBlurCircles(theme);

  return (
    <div className={cn(
      "relative flex min-h-screen flex-col overflow-hidden",
      getBackgroundVariant("default", theme)
    )}>
      {/* Animated blur circles */}
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className={cn(`absolute -left-20 top-24 h-72 w-72 rounded-full blur-[120px]`, blurCircles.circle1)} />
        <div className={cn(`absolute right-12 top-12 h-64 w-64 rounded-full blur-[100px]`, blurCircles.circle2)} />
        <div className={cn(`absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-[90px]`, blurCircles.circle3)} />
      </div>

      {/* Main content */}
      <div className="relative w-full">
        <HeroSection stats={stats} />
        <FeaturedQuizzes quizzes={featuredQuizzes} />
        <PopularTopics topics={topTopics} />
        <SocialProof stats={stats} />
        <HowItWorks />
        <Features />
        <Testimonials />
        <FinalCTA />
      </div>
    </div>
  );
}
