import { Suspense } from "react";
import { HeroSection } from "./HeroSection";
import { SocialProof } from "./SocialProof";
import { HowItWorks } from "./HowItWorks";
import { Features } from "./Features";
import { Testimonials } from "./Testimonials";
import { FinalCTA } from "./FinalCTA";
import { FeaturedQuizzes } from "./FeaturedQuizzes";
import { PopularTopics } from "./PopularTopics";
import { FeaturedQuizzesSkeleton } from "./FeaturedQuizzesSkeleton";
import { PopularTopicsSkeleton } from "./PopularTopicsSkeleton";
import { QuickStartArena } from "./QuickStartArena";

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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Hero Section */}
      <HeroSection stats={stats} />

      {/* Quick Start Arena - High Engagement */}
      <QuickStartArena />

      {/* Featured Content Sections */}
      <section className="py-24 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Suspense fallback={<FeaturedQuizzesSkeleton />}>
            <FeaturedQuizzes />
          </Suspense>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Suspense fallback={<PopularTopicsSkeleton />}>
            <PopularTopics />
          </Suspense>
        </div>
      </section>

      {/* Social Proof & Trust */}
      <SocialProof stats={stats} />

      {/* Process & Methodology */}
      <HowItWorks />

      {/* Secondary Features */}
      <Features />

      {/* Testimonials */}
      <section className="py-24 bg-muted/30">
        <Testimonials />
      </section>

      {/* Final Conversion */}
      <FinalCTA />
    </div>
  );
}
