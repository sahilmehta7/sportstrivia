import { PageContainer } from "@/components/shared/PageContainer";
import type { PersonalizedHomePayload, PersonalizedHomeVariant } from "@/types/personalized-home";
import Link from "next/link";
import {
  getRailEyebrow,
  getRailTitle,
  PersonalizedContinueCard,
  PersonalizedDailyChallengePanel,
  PersonalizedHomeHero,
  PersonalizedQuizRailCard,
  PersonalizedRailSectionHeader,
  PersonalizedStarterCollectionCard,
} from "@/components/home/personalized";

type AuthenticatedPersonalizedHomeProps = {
  payload: PersonalizedHomePayload;
  variant: PersonalizedHomeVariant;
};

export function AuthenticatedPersonalizedHome({ payload, variant }: AuthenticatedPersonalizedHomeProps) {
  return (
    <main className="relative min-h-screen overflow-hidden pb-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse-glow motion-reduce:animate-none" />
        <div className="absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-accent/10 blur-3xl motion-safe:animate-pulse-glow motion-reduce:animate-none" />
      </div>

      <PageContainer className="space-y-10 pt-6 md:space-y-12 md:pt-12">
        <PersonalizedHomeHero
          displayName={payload.userSummary.displayName}
          currentStreak={payload.userSummary.currentStreak}
          longestStreak={payload.userSummary.longestStreak}
          variant={variant}
        />

        {payload.continuePlaying.length > 0 ? (
          <section className="motion-safe:animate-slide-up motion-reduce:animate-none">
            <PersonalizedRailSectionHeader
              eyebrow="In Progress"
              title="Continue Playing"
              subtitle="Resume active runs and keep your streak alive."
            />

            <div className="-mx-4 overflow-x-auto px-4 pb-2 md:hidden">
              <div className="flex snap-x snap-mandatory gap-4">
                {payload.continuePlaying.map((item) => (
                  <div key={item.id} className="w-[82vw] max-w-[340px] shrink-0 snap-start">
                    <PersonalizedContinueCard item={item} />
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden gap-4 md:grid md:grid-cols-3">
              {payload.continuePlaying.map((item) => (
                <PersonalizedContinueCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        {payload.dailyChallenge ? (
          <div className="motion-safe:animate-slide-up motion-reduce:animate-none">
            <PersonalizedDailyChallengePanel challenge={payload.dailyChallenge} />
          </div>
        ) : null}

        <div className="space-y-10 motion-safe:animate-slide-up motion-reduce:animate-none">
          {payload.rails.map((rail) => (
            <section key={rail.railId ?? `${rail.kind}:${rail.title}`}>
              <PersonalizedRailSectionHeader
                eyebrow={getRailEyebrow(rail)}
                title={getRailTitle(rail)}
              />

              <div className="-mx-4 overflow-x-auto px-4 pb-2 md:hidden">
                <div className="flex snap-x snap-mandatory gap-4">
                  {rail.items.map((item) => (
                    <div key={item.quizId} className="w-[82vw] max-w-[340px] shrink-0 snap-start">
                      <PersonalizedQuizRailCard item={item} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden gap-4 md:grid md:grid-cols-3">
                {rail.items.map((item) => (
                  <PersonalizedQuizRailCard
                    key={item.quizId}
                    item={item}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {payload.starterCollections.length > 0 ? (
          <section className="motion-safe:animate-slide-up motion-reduce:animate-none">
            <PersonalizedRailSectionHeader
              eyebrow="Quick Start"
              title="Starter Collections"
              subtitle="Curated ramps to help you discover new lanes."
            />

            <div className="-mx-4 overflow-x-auto px-4 pb-2 md:hidden">
              <div className="flex snap-x snap-mandatory gap-4">
                {payload.starterCollections.map((collection) => (
                  <div key={collection.id} className="w-[82vw] max-w-[340px] snap-start">
                    <PersonalizedStarterCollectionCard collection={collection} />
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden gap-4 md:grid md:grid-cols-3">
              {payload.starterCollections.map((collection) => (
                <PersonalizedStarterCollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
          </section>
        ) : null}

        <div className="flex justify-center pt-2">
          <Link
            href="/quizzes"
            className="inline-flex min-h-touch items-center rounded-none border border-primary/30 px-5 text-xs font-black uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Browse All Quizzes
          </Link>
        </div>
      </PageContainer>
    </main>
  );
}
