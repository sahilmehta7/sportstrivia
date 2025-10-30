import { Metadata } from "next";
import { ShowcaseRatingStars, ShowcaseRatingBreakdown, ShowcaseReviewsPanel, ShowcaseRatingSummary } from "@/components/showcase/ui";

export const metadata: Metadata = {
  title: "Quiz Ratings & Reviews",
  description: "Showcase of ratings, reviews, empty states and actions for a quiz",
};

export default function QuizRatingsReviewsShowcasePage() {
  // This is a server component wrapper; children components manage theme via provider in layout
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-amber-500 px-4 py-12 sm:px-6 lg:py-16">
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-emerald-400/40 blur-[120px]" />
        <div className="absolute right-12 top-12 h-64 w-64 rounded-full bg-pink-500/40 blur-[100px]" />
        <div className="absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-blue-500/30 blur-[90px]" />
      </div>

      <div className="mx-auto w-full max-w-5xl rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-black/70 via-slate-900/60 to-indigo-900/80 p-6 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8 lg:p-10">
        <Header />

        <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Mobile-first: Ratings Summary (no breakdown) */}
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:p-6 text-white shadow-[0_32px_80px_-40px_rgba(15,15,35,0.6)]">
              <ShowcaseRatingSummary averageRating={4.3} totalReviews={128} />
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-white shadow-[0_32px_80px_-40px_rgba(15,15,35,0.6)]">
              <h2 className="mb-4 text-lg font-semibold">Ratings Summary</h2>
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                  <ShowcaseRatingStars
                    averageRating={4.3}
                    totalReviews={128}
                    size="lg"
                    className="bg-white/5 border border-white/10 text-white"
                  />
                </div>
                <ShowcaseRatingBreakdown
                  breakdown={{ 5: 80, 4: 28, 3: 12, 2: 5, 1: 3 }}
                  className="bg-white/5 border border-white/10 text-white"
                />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-white shadow-[0_32px_80px_-40px_rgba(15,15,35,0.6)]">
              <h2 className="mb-4 text-lg font-semibold">Reviews List</h2>
              <ShowcaseReviewsPanel
                reviews={[
                  {
                    id: "1",
                    reviewer: { name: "Alex Johnson", role: "Avid Fan" },
                    rating: 5,
                    quote: "Loved the mix of classic and modern trivia!",
                    dateLabel: "2 days ago",
                  },
                  {
                    id: "2",
                    reviewer: { name: "Priya Singh", role: "Quiz Enthusiast" },
                    rating: 4,
                    quote: "Great challenge. A few questions were tough but fair.",
                    dateLabel: "1 week ago",
                  },
                ]}
                className="bg-white/0 border-0 p-0"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-white shadow-[0_32px_80px_-40px_rgba(15,15,35,0.6)]">
              <h2 className="mb-4 text-lg font-semibold">Empty State + Add Review</h2>
              <ShowcaseReviewsPanel reviews={[]} className="bg-white/0 border-0 p-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <div className="mb-10 text-center">
      <h1 className="text-foreground text-3xl font-bold">Quiz Ratings & Reviews</h1>
      <p className="text-muted-foreground mt-2 text-base">
        Reusable elements: ratings summary, breakdown, reviews list, empty state, and add review.
      </p>
    </div>
  );
}


