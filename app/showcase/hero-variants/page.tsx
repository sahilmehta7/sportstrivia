"use client";

import {
  ShowcaseHeroSpotlight,
  ShowcaseHeroSplit,
  ShowcaseHeroBanner,
  ShowcaseHeroDeck,
} from "@/components/showcase/ui";
import {
  ArrowRight,
  Play,
  Sparkles,
  ShieldCheck,
  Flame,
  Users,
  Star,
  Trophy,
  Compass,
} from "lucide-react";

export default function ShowcaseHeroVariantsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16">
        <ShowcaseHeroSpotlight
          eyebrow="Showcase"
          title="Discover the next era of"
          highlightedText="Sports Trivia"
          subtitle="Premium hero layout with glassmorphism styling, ideal for product launches or marquee announcements across light and dark themes."
          primaryAction={{
            label: "Start a Quiz",
            href: "/quizzes",
            icon: <Play className="h-4 w-4" />,
          }}
          secondaryAction={{
            label: "View Leaderboards",
            href: "/leaderboard",
            variant: "secondary",
          }}
          stats={[
            { label: "Quizzes", value: 1820 },
            { label: "Players", value: "78k" },
            { label: "Daily Challenges", value: 12 },
            { label: "Average Rating", value: "4.8" },
          ]}
          backgroundImageUrl="https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=1400&q=80"
        />

        <ShowcaseHeroSplit
          eyebrow="Play Your Way"
          title="Tailored quiz journeys for every fan"
          subtitle="Combine rich media with a structured highlight list to communicate feature pillars or value propositions."
          highlights={[
            {
              title: "Adaptive difficulty",
              description: "Dynamic question pools that match each player’s pace and mastery.",
              icon: <ShieldCheck className="h-4 w-4" />,
            },
            {
              title: "Live competitions",
              description: "Weekly tournaments with real-time updates and highlight reels.",
              icon: <Trophy className="h-4 w-4" />,
            },
            {
              title: "Community play",
              description: "Create private rooms, invite friends, and track collective stats.",
              icon: <Users className="h-4 w-4" />,
            },
          ]}
          media={
            <div className="flex h-full items-center justify-center rounded-2xl bg-slate-900/60 p-8 text-white">
              <div className="space-y-4 text-left">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/80">
                  <Sparkles className="h-3 w-3" />
                  Premium Mode
                </span>
                <h3 className="text-2xl font-bold">Quiz Studio</h3>
                <p className="text-sm text-white/70">
                  Visualize player streaks, surface coaching insights, and replay iconic moments from every match.
                </p>
              </div>
            </div>
          }
          primaryAction={{
            label: "Explore Features",
            href: "/showcase/ui-playground",
            icon: <ArrowRight className="h-4 w-4" />,
          }}
          secondaryAction={{
            label: "See Case Study",
            href: "/showcase/quiz-results",
            variant: "ghost",
          }}
        />

        <ShowcaseHeroBanner
          title="Sprint Season is live"
          subtitle="Join weekly sprint quizzes for lightning-fast trivia, special badges, and exclusive rewards."
          icon={<Flame className="h-6 w-6" />}
          actions={[
            {
              label: "Join the Sprint",
              href: "/quizzes?sortBy=createdAt",
              icon: <ArrowRight className="h-4 w-4" />,
            },
            {
              label: "View Rewards",
              href: "/leaderboard",
              variant: "ghost",
            },
          ]}
          align="center"
        />

        <ShowcaseHeroDeck
          title="Discover new contenders"
          subtitle="Card-forward hero layout to feature collections, categories, or editorial picks."
          cards={[
            {
              title: "Legends of Football",
              description: "Premier League dynasties, World Cup storylines, and tactical masterminds.",
              icon: <Star className="h-5 w-5" />,
              stat: "24 quizzes",
              href: "/topics/football",
            },
            {
              title: "Grand Slam Club",
              description: "From clay courts to grass, relive historic tennis rivalries and upsets.",
              icon: <Trophy className="h-5 w-5" />,
              stat: "18 quizzes",
              href: "/topics/tennis",
            },
            {
              title: "Racing Chronicles",
              description: "Formula 1 legends, iconic circuits, and behind-the-scenes engineering feats.",
              icon: <Compass className="h-5 w-5" />,
              stat: "12 quizzes",
              href: "/topics/formula-1",
            },
          ]}
          primaryAction={{
            label: "Browse All Topics",
            href: "/topics",
            icon: <ArrowRight className="h-4 w-4" />,
          }}
        />
      </div>
    </div>
  );
}
