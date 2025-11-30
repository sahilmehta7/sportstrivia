"use client";

import { useState } from "react";
import {
  ShowcasePage,
  ShowcaseTopNav,
  ShowcaseAnnouncementBanner,
  ShowcaseSearchBar,
  ShowcaseFilterBar,
  ShowcaseFilterDrawer,
  ShowcaseSortDropdown,
  ShowcaseSavedFilters,
  ShowcaseTrendingRail,
  ShowcaseSectionHeader,
  ShowcaseMasonryGrid,
  ShowcaseQuizSummaryCard,
  ShowcaseCreatorSpotlightCard,
  ShowcaseTopicInsightWidget,
  ShowcaseAchievementBadgeCarousel,
  ShowcaseMiniLeaderboard,
  ShowcasePerformanceSparkline,
  ShowcaseProgressTrackerRibbon,
  ShowcaseSplitFeaturePanel,
  ShowcaseReviewCard,
  ShowcaseShareStrip,
  ShowcaseContinuePlayingQueue,
  ShowcaseTagCloud,
  ShowcaseQuickPreviewModal,
  ShowcaseDidYouKnowPanel,
  ShowcaseNewsletterSignup,
  ShowcaseFaqAccordion,
  ShowcaseEmptyState,
  ShowcaseToast,
  ShowcaseOnboardingTooltipStack,
  ShowcasePagination,
  ShowcaseTopicWiseStats,
} from "@/showcase/components";
import type { ShowcaseFilterGroup } from "@/components/showcase/ui/FilterBar";
import type { ShowcaseSearchChip } from "@/components/showcase/ui/SearchBar";
import type { TrendingRailItem } from "@/components/showcase/ui/TrendingRail";
import type { ContinuePlayingItem } from "@/components/showcase/ui/ContinuePlayingQueue";
import type { TagCloudTag } from "@/components/showcase/ui/TagCloud";
import type { MiniLeaderboardEntry } from "@/components/showcase/ui/MiniLeaderboard";
import type { OnboardingStep } from "@/components/showcase/ui/OnboardingTooltipStack";
import Link from "next/link";
import { GlassButton } from "@/components/showcase/ui/GlassButton";
import React from "react";

function SkeletonWidget() {
  return (
    <div className="rounded-[22px] p-4 backdrop-blur-xl ring-1 ring-white/10 bg-white/5">
      <div className="mb-3 flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-4 w-36 animate-pulse rounded bg-white/20" />
          <div className="h-3 w-48 animate-pulse rounded bg-white/10" />
        </div>
        <div className="h-8 w-20 animate-pulse rounded-full bg-white/10" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 animate-pulse rounded-lg bg-white/10" />
                <div className="space-y-1">
                  <div className="h-3 w-28 animate-pulse rounded bg-white/20" />
                  <div className="h-2.5 w-24 animate-pulse rounded bg-white/10" />
                </div>
              </div>
              <div className="w-32 space-y-1">
                <div className="flex items-center justify-between text-[10px] text-white/40">
                  <span>Accuracy</span>
                  <span>—</span>
                </div>
                <div className="h-1 w-full animate-pulse rounded-full bg-white/10" />
              </div>
              <div className="h-5 w-16 animate-pulse rounded-full bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const searchChips: ShowcaseSearchChip[] = [
  { value: "new", label: "New", emoji: "✨", active: true },
  { value: "popular", label: "Popular", emoji: "🔥" },
  { value: "live", label: "Live", emoji: "🎥" },
];

const trendingItems: TrendingRailItem[] = [
  {
    id: "1",
    title: "Ultimate Finals Blitz",
    subtitle: "Live now · 5k watching",
    coverImageUrl: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d",
    live: true,
    streakLabel: "Streak x4",
  },
  {
    id: "2",
    title: "Legends of Roland Garros",
    subtitle: "Daily challenge",
    coverImageUrl: "https://images.unsplash.com/photo-1505904267569-80ede38b6a01",
    streakLabel: "New",
  },
  {
    id: "3",
    title: "NBA Timeline Trivia",
    subtitle: "Can you beat the clock?",
    coverImageUrl: "https://images.unsplash.com/photo-1517578900485-1bbf0c03a402",
  },
];

const continueItems: ContinuePlayingItem[] = [
  { id: "cp-1", title: "MLS Rivalries", progress: 0.45, streak: 3, lastPlayedLabel: "2h ago" },
  { id: "cp-2", title: "Cricket World Cups", progress: 0.8, lastPlayedLabel: "Yesterday" },
];

const tags: TagCloudTag[] = [
  { value: "prem", label: "Premier League", count: 24 },
  { value: "mlb", label: "MLB", count: 18 },
  { value: "f1", label: "Formula 1", count: 11 },
  { value: "laliga", label: "La Liga", count: 15 },
  { value: "nfl", label: "NFL", count: 20 },
];

const leaderboardEntries: MiniLeaderboardEntry[] = [
  { id: "lb-1", name: "Lena Park", score: 9820 },
  { id: "lb-2", name: "Marco Ruiz", score: 9540 },
  { id: "lb-3", name: "Nia Carter", score: 9485 },
];

const onboardingSteps: OnboardingStep[] = [
  { id: "step-1", title: "Pick a quiz", description: "Browse by sport, creator, or live event.", icon: "1️⃣" },
  { id: "step-2", title: "Lock in a streak", description: "Beat the clock to earn bonus multipliers.", icon: "2️⃣" },
  { id: "step-3", title: "Challenge friends", description: "Share your score instantly for a rematch.", icon: "3️⃣" },
];

const sparklineData = {
  values: [40, 65, 55, 80, 70, 90, 85, 95],
  label: "Weekly Performance",
  trend: "+15%",
};

// Level Progress (initialized with placeholder; replaced after fetch)
const initialProgressData = {
  label: "Level Progress",
  current: 0,
  goal: 100,
  milestoneLabel: "Next Level",
};

const quizCards = [
  {
    id: "q1",
    title: "Legends of the Premier League",
    subtitle: "Guess iconic moments across seasons, clubs, and rivalries.",
    category: "Football",
    tags: ["Premier League", "Legends"],
    coverImageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20",
  },
  {
    id: "q2",
    title: "Grand Slam Trivia",
    subtitle: "How well do you know tennis champions across eras?",
    category: "Tennis",
    tags: ["ATP", "WTA"],
    coverImageUrl: "https://images.unsplash.com/photo-1505664194779-8beaceb93744",
  },
  {
    id: "q3",
    title: "History of the Olympics",
    subtitle: "From Athens to Paris—test your knowledge.",
    category: "Olympics",
    tags: ["Summer", "Milestones"],
    coverImageUrl: "https://images.unsplash.com/photo-1505843513577-22bb7d21e455",
  },
];

interface ShowcaseUiPlaygroundContentProps {
  filterGroups: ShowcaseFilterGroup[];
}

export function ShowcaseUiPlaygroundContent({ filterGroups }: ShowcaseUiPlaygroundContentProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [topTopics, setTopTopics] = useState<any[] | null>(null);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [unauth, setUnauth] = useState(false);
  const [levelProgress, setLevelProgress] = useState(initialProgressData);

  // Fetch real top topics for current user
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/users/me/stats", { cache: "no-store" });
        if (res.status === 401) {
          setUnauth(true);
          return;
        }
        if (!res.ok) return;
        const json = await res.json();
        if (json?.success && Array.isArray(json.data?.topTopics)) {
          setTopTopics(json.data.topTopics);
        }
      } catch {
        // ignore fetch errors in showcase preview
      } finally {
        setLoadingTopics(false);
      }
    })();
  }, []);

  // Fetch user gamification (server-computed) for the ribbon
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/users/me/gamification", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const data = json?.data ?? json;
        const progress: number = data?.progress ?? 0;
        const span: number = data?.span ?? 100;
        const tierName: string = data?.tierName ?? "Rookie";
        setLevelProgress({
          label: `${tierName}`,
          current: progress,
          goal: span,
          milestoneLabel: data?.nextRequired ? `Level ${Math.min(100, (data?.level ?? 0) + 1)}` : "Max Level",
        });
      } catch {
        // ignore errors in showcase
      }
    })();
  }, []);

  const topicsMapped = (topTopics ?? []).map((t: any) => ({
    id: t.id,
    label: t.topic?.name ?? "",
    accuracyPercent: Math.round(t.successRate ?? 0),
    quizzesTaken: t.questionsAnswered ?? 0,
    icon: t.topic?.emoji ?? "🏷️",
  }));

  return (
    <ShowcasePage
      title="UI Playground"
      subtitle="Preview the reusable showcase components in light and dark themes"
      badge="SHOWCASE UI"
      variant="vibrant"
      breadcrumbs={[{ label: "UI Components", href: "/showcase" }, { label: "UI Playground" }]}
      actions={<ShowcaseSavedFilters filters={[{ id: "preset-1", label: "My Clubs", emoji: "⚽" }, { id: "preset-2", label: "Live Events", emoji: "🎙️" }]} />}
    >
      <div className="space-y-10">
        <ShowcaseTopNav />
        <ShowcaseAnnouncementBanner message="Creator Week is live—new packs drop daily." href="#" />

        <ShowcaseSearchBar chips={searchChips} showAdvancedButton />
        <ShowcaseFilterBar groups={filterGroups} onReset={() => {}} />
        <ShowcaseFilterDrawer>
          <ShowcaseFilterBar groups={filterGroups} condensed onChange={() => {}} />
        </ShowcaseFilterDrawer>
        <ShowcaseSortDropdown
          value="trending"
          options={[{ value: "trending", label: "Trending", metric: "+18%" }, { value: "new", label: "Newest" }, { value: "rating", label: "Rating", metric: "4.8" }]}
          onChange={() => {}}
        />

        <ShowcaseTrendingRail items={trendingItems} />
        <ShowcaseContinuePlayingQueue items={continueItems} />
        <ShowcaseTagCloud tags={tags} />

        <ShowcaseSectionHeader
          eyebrow="Discover"
          title="Featured Quizzes"
          subtitle="Mix and match components to craft your listing."
        />
        <ShowcaseMasonryGrid columns={2} className="gap-6">
          {quizCards.map((card) => (
            <ShowcaseQuickPreviewModal
              key={card.id}
              trigger={
                <ShowcaseQuizSummaryCard
                  title={card.title}
                  subtitle={card.subtitle}
                  category={card.category}
                  tags={card.tags}
                  coverImageUrl={card.coverImageUrl}
                  meta={{ durationLabel: "20 min", playersLabel: "12.3k players", difficulty: "Medium", rating: 4.7 }}
                />
              }
              title={card.title}
            >
              <div className="space-y-4 p-6">
                <p className="text-sm text-muted-foreground">
                  This is a preview modal for the {card.title} quiz. In a real implementation, this would contain detailed quiz information.
                </p>
              </div>
            </ShowcaseQuickPreviewModal>
          ))}
        </ShowcaseMasonryGrid>

        {/* Topic Wise Stats Demo */}
        <ShowcaseSectionHeader
          eyebrow="Insights"
          title="Topic Wise Stats"
          subtitle="Top topics summary with glassmorphism in light & dark."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {unauth ? (
            <div className="col-span-2 rounded-[22px] p-6 text-center backdrop-blur-xl ring-1 ring-white/10 bg-white/5">
              <p className="mb-4 text-sm">Sign in to see your topic-wise performance.</p>
              <GlassButton asChild>
                <Link href="/auth/signin">Sign in</Link>
              </GlassButton>
            </div>
          ) : loadingTopics ? (
            <>
              <SkeletonWidget />
              <SkeletonWidget />
            </>
          ) : (
            <>
              <ShowcaseTopicWiseStats
                topics={
                  topicsMapped.length > 0
                    ? topicsMapped
                    : [
                        { id: "t1", label: "Premier League", accuracyPercent: 88, quizzesTaken: 34, streak: 4, icon: "⚽" },
                        { id: "t2", label: "NBA", accuracyPercent: 76, quizzesTaken: 21, streak: 2, icon: "🏀" },
                        { id: "t3", label: "Cricket", accuracyPercent: 69, quizzesTaken: 18, streak: 3, icon: "🏏" },
                        { id: "t4", label: "Formula 1", accuracyPercent: 82, quizzesTaken: 12, streak: 1, icon: "🏎️" },
                        { id: "t5", label: "NFL", accuracyPercent: 64, quizzesTaken: 15, icon: "🏈" },
                      ]
                }
                limit={3}
                viewAllHref="/showcase/topic-wise-stats-complete"
              />

              <ShowcaseTopicWiseStats
                title="Top 5 Topics"
                description="Performance snapshot"
                topics={
                  topicsMapped.length > 0
                    ? topicsMapped
                    : [
                        { id: "t1", label: "Tennis", accuracyPercent: 91, quizzesTaken: 27, icon: "🎾" },
                        { id: "t2", label: "La Liga", accuracyPercent: 79, quizzesTaken: 14, icon: "⚽" },
                        { id: "t3", label: "Olympics", accuracyPercent: 72, quizzesTaken: 10, icon: "🏅" },
                        { id: "t4", label: "Baseball", accuracyPercent: 65, quizzesTaken: 9, icon: "⚾" },
                        { id: "t5", label: "Rugby", accuracyPercent: 58, quizzesTaken: 6, icon: "🏉" },
                      ]
                }
                limit={5}
                viewAllHref="/showcase/topic-wise-stats-complete"
              />
            </>
          )}
        </div>

        {/* Pagination Demo */}
        <div className="space-y-6">
          <ShowcaseSectionHeader
            eyebrow="Navigation"
            title="Pagination Component"
            subtitle="Elegant page navigation with ellipsis support for large datasets."
          />
          
          <div className="space-y-8">
            {/* Basic Pagination */}
            <div className="rounded-2xl border p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
              <h3 className="mb-4 text-lg font-semibold">Basic Pagination</h3>
              <ShowcasePagination
                currentPage={currentPage}
                totalPages={10}
                onPageChange={setCurrentPage}
              />
            </div>

            {/* Without First/Last */}
            <div className="rounded-2xl border p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
              <h3 className="mb-4 text-lg font-semibold">Without First/Last Buttons</h3>
              <ShowcasePagination
                currentPage={currentPage}
                totalPages={10}
                onPageChange={setCurrentPage}
                showFirstLast={false}
              />
            </div>

            {/* Without Page Numbers */}
            <div className="rounded-2xl border p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
              <h3 className="mb-4 text-lg font-semibold">Just Arrows</h3>
              <ShowcasePagination
                currentPage={currentPage}
                totalPages={10}
                onPageChange={setCurrentPage}
                showPageNumbers={false}
                showFirstLast={false}
              />
            </div>

            {/* Large Dataset with Ellipsis */}
            <div className="rounded-2xl border p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)' }}>
              <h3 className="mb-4 text-lg font-semibold">Large Dataset (50 pages)</h3>
              <ShowcasePagination
                currentPage={currentPage}
                totalPages={50}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>

        {/* Additional Showcase Components */}
        <ShowcaseSectionHeader
          eyebrow="Components"
          title="Additional UI Elements"
          subtitle="More showcase components for your application."
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Topic Insight Widget */}
          <ShowcaseTopicInsightWidget
            title="Football"
            totalQuizzes={42}
            followers={12500}
            accuracyPercent={87}
            breakdown={[
              { label: "Easy", value: 95 },
              { label: "Medium", value: 78 },
              { label: "Hard", value: 65 },
            ]}
          />

          {/* Creator Spotlight */}
          <ShowcaseCreatorSpotlightCard
            name="Sports Guru"
            bio="Creating legendary sports trivia"
            followersLabel="18.5k followers"
            topQuizLabel="NBA History Master"
            accent="from-blue-500 via-purple-500 to-pink-500"
          />

          {/* Mini Leaderboard */}
          <ShowcaseMiniLeaderboard entries={leaderboardEntries} />
        </div>

        {/* Performance & Progress Components */}
        <div className="grid gap-6 md:grid-cols-2">
          <ShowcasePerformanceSparkline 
            label={sparklineData.label}
            values={sparklineData.values}
          />
          <ShowcaseProgressTrackerRibbon 
            label={levelProgress.label}
            current={levelProgress.current}
            goal={levelProgress.goal}
            milestoneLabel={levelProgress.milestoneLabel}
          />
        </div>

        {/* Feature Panels */}
        <ShowcaseSplitFeaturePanel
          title="Level Up Your Knowledge"
          description="Track your progress across all sports"
          points={[
            "Deep insights into your performance",
            "Compete with players worldwide",
            "Unlock badges and milestones",
          ]}
          ctaLabel="Explore Features"
          imageUrl="https://images.unsplash.com/photo-1551698618-1dfe5d97d256"
        />

        {/* Achievement & Review Components */}
        <ShowcaseSectionHeader
          eyebrow="Features"
          title="Rewards & Feedback"
          subtitle="Badges, reviews, and sharing components."
        />

        <div className="grid gap-6 md:grid-cols-2">
          <ShowcaseAchievementBadgeCarousel
            badges={[
              { id: "b1", name: "First Win", icon: "🏅", unlocked: true },
              { id: "b2", name: "Perfect Score", icon: "💯", unlocked: true },
              { id: "b3", name: "Week Warrior", icon: "⚔️", unlocked: false },
              { id: "b4", name: "Speed Demon", icon: "⚡", unlocked: true },
            ]}
          />

          <ShowcaseReviewCard
            reviewer={{
              name: "Alex Johnson",
              role: "Sports Enthusiast",
              avatarUrl: null,
            }}
            rating={5}
            quote="Amazing quiz! Challenging but fair. Learned a lot about NBA history."
            dateLabel="2 days ago"
          />
        </div>

        {/* Did You Know & Newsletter */}
        <ShowcaseDidYouKnowPanel
          fact="The fastest goal in World Cup history was scored in 11 seconds by Hakan Şükür in 2002."
          sourceLabel="Did You Know"
        />

        <ShowcaseNewsletterSignup
          title="Stay Updated"
          description="Get notified about new quizzes, challenges, and exclusive content."
          onSubmit={(email) => console.log(email)}
        />

        {/* FAQ Accordion */}
        <ShowcaseSectionHeader
          eyebrow="Support"
          title="Frequently Asked Questions"
          subtitle="Quick answers to common questions."
        />

        <ShowcaseFaqAccordion
          items={[
            {
              question: "How do I create my own quiz?",
              answer: "Use the Quiz Creator to build custom quizzes with your own questions and images.",
            },
            {
              question: "Can I play quizzes offline?",
              answer: "Currently, all quizzes require an active internet connection to load questions and sync progress.",
            },
            {
              question: "How are points calculated?",
              answer: "Points are based on correct answers, speed bonuses, and streak multipliers. The faster you answer, the more points you earn!",
            },
          ]}
        />

        {/* Share Strip */}
        <ShowcaseShareStrip
          shareUrl="https://sportstrivia.app/quiz/nba-legends"
          message="Check out this amazing NBA quiz!"
          onShare={(platform) => console.log(`Shared on ${platform}`)}
        />

        {/* Empty State & Toast */}
        <ShowcaseSectionHeader
          eyebrow="Feedback"
          title="Empty States & Notifications"
          subtitle="User feedback and state components."
        />

        <div className="grid gap-6 md:grid-cols-2">
          <ShowcaseEmptyState
            icon="📭"
            title="No quizzes found"
            description="Try adjusting your filters or check back later for new content."
          />

          <div>
            <h3 className="mb-4 text-lg font-semibold">Toast Notifications</h3>
            <ShowcaseToast
              title="Success"
              description="Your quiz was completed successfully!"
              icon="✓"
            />
          </div>
        </div>

        {/* Onboarding Tooltips */}
        <ShowcaseOnboardingTooltipStack steps={onboardingSteps} />
      </div>
    </ShowcasePage>
  );
}
