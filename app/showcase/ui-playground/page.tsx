"use client";

import {
  ShowcasePage,
  ShowcaseTopNav,
  ShowcaseAnnouncementBanner,
  ShowcaseBreadcrumbs,
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
  ShowcaseContinuePlayingQueue,
  ShowcaseTagCloud,
  ShowcaseQuickPreviewModal,
  ShowcaseReviewCard,
  ShowcaseShareStrip,
  ShowcaseDidYouKnowPanel,
  ShowcaseNewsletterSignup,
  ShowcaseFaqAccordion,
  ShowcaseEmptyState,
  ShowcaseToast,
  ShowcaseFooter,
  ShowcaseOnboardingTooltipStack,
} from "@/showcase/components";
import type { ShowcaseFilterGroup } from "@/components/showcase/ui/FilterBar";
import type { ShowcaseSearchChip } from "@/components/showcase/ui/SearchBar";
import type { TrendingRailItem } from "@/components/showcase/ui/TrendingRail";
import type { ContinuePlayingItem } from "@/components/showcase/ui/ContinuePlayingQueue";
import type { TagCloudTag } from "@/components/showcase/ui/TagCloud";
import type { MiniLeaderboardEntry } from "@/components/showcase/ui/MiniLeaderboard";
import type { OnboardingStep } from "@/components/showcase/ui/OnboardingTooltipStack";

const searchChips: ShowcaseSearchChip[] = [
  { value: "new", label: "New", emoji: "✨", active: true },
  { value: "popular", label: "Popular", emoji: "🔥" },
  { value: "live", label: "Live", emoji: "🎥" },
];

const filterGroups: ShowcaseFilterGroup[] = [
  {
    id: "category",
    label: "Category",
    options: [
      { value: "all", label: "All" },
      { value: "history", label: "History", emoji: "🏛️" },
      { value: "soccer", label: "Soccer", emoji: "⚽" },
      { value: "nba", label: "NBA", emoji: "🏀" },
    ],
    activeValue: "all",
  },
  {
    id: "difficulty",
    label: "Difficulty",
    type: "select",
    options: [
      { value: "all", label: "All levels" },
      { value: "easy", label: "Easy" },
      { value: "medium", label: "Medium" },
      { value: "hard", label: "Hard" },
    ],
    activeValue: "all",
  },
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

export default function ShowcaseUiPlaygroundPage() {
  return (
    <ShowcasePage
      title="UI Playground"
      subtitle="Preview the reusable showcase components in light and dark themes"
      badge="SHOWCASE UI"
      variant="vibrant"
      actions={<ShowcaseSavedFilters filters={[{ id: "preset-1", label: "My Clubs", emoji: "⚽" }, { id: "preset-2", label: "Live Events", emoji: "🎙️" }]} />}
    >
      <div className="space-y-10">
        <ShowcaseTopNav />
        <ShowcaseAnnouncementBanner message="Creator Week is live—new packs drop daily." href="#" />
        <ShowcaseBreadcrumbs items={[{ label: "Discover", href: "/showcase" }, { label: "UI Playground" }]} />

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
              description={card.subtitle}
              coverImageUrl={card.coverImageUrl}
              durationLabel="20 min"
              difficultyLabel="Medium"
            />
          ))}
        </ShowcaseMasonryGrid>

        <div className="grid gap-6 md:grid-cols-2">
          <ShowcaseCreatorSpotlightCard
            name="Coach Azunyan"
            bio="Former pro turned creator. Hosts weekly live quiz battles."
            followersLabel="18.4k followers"
            topQuizLabel="Fast Break Trivia"
            avatarUrl="https://images.unsplash.com/photo-1524504388940-b1c1722653e1"
          />
          <ShowcaseTopicInsightWidget
            title="Premier League"
            totalQuizzes={128}
            followers={32500}
            accuracyPercent={71}
            breakdown={[{ label: "History", value: 40 }, { label: "Live", value: 30 }, { label: "Legends", value: 30 }]}
          />
        </div>

        <ShowcaseAchievementBadgeCarousel
          badges={[
            { id: "badge-1", name: "Trivia Rookie", description: "Play your first quiz", unlocked: true, icon: "🥇" },
            { id: "badge-2", name: "Streak Master", description: "7-day streak", icon: "🔥" },
            { id: "badge-3", name: "Perfect Run", description: "Score 100% twice", icon: "💯" },
          ]}
        />

        <div className="grid gap-6 md:grid-cols-3">
          <ShowcaseMiniLeaderboard entries={leaderboardEntries} />
          <ShowcasePerformanceSparkline label="Avg Score" values={[45, 52, 60, 65, 70, 78]} />
          <ShowcaseProgressTrackerRibbon label="Elite Tier" current={720} goal={1000} milestoneLabel="280 pts to Legendary" />
        </div>

        <ShowcaseSectionHeader eyebrow="Social" title="Community Buzz" subtitle="See what players are saying and sharing." />
        <div className="grid gap-6 md:grid-cols-3">
          <ShowcaseReviewCard
            reviewer={{ name: "Taylor Brooks", role: "Trivia Night Host", avatarUrl: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39" }}
            rating={5}
            quote="These showcase cards make it ridiculously easy to curate a premium trivia experience."
            dateLabel="2 hours ago"
          />
          <ShowcaseShareStrip shareUrl="https://quizverse.app/quiz/123" />
          <ShowcaseDidYouKnowPanel fact="Players who join a live event within 10 minutes see 2x higher streak retention." />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <ShowcaseNewsletterSignup />
          <ShowcaseFaqAccordion
            items={[
              { question: "How do streaks work?", answer: "Finish a quiz daily to keep the streak alive and unlock multipliers." },
              { question: "Can I create my own quiz?", answer: "Yes! Use the creator studio to build and publish within minutes." },
            ]}
          />
        </div>

        <ShowcaseOnboardingTooltipStack steps={onboardingSteps} />

        <ShowcaseEmptyState
          icon="🎯"
          title="No quizzes match this combo"
          description="Try loosening a filter or explore suggested topics."
          actionLabel="Clear filters"
        />

        <ShowcaseToast title="Saved to My Mix" description="We’ll drop new challenges straight into your feed." />

        <ShowcaseFooter className="mt-8" />
      </div>
    </ShowcasePage>
  );
}
