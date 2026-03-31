
import { auth } from "@/lib/auth";
import { getPublicQuizList } from "@/lib/services/public-quiz.service";
import { FeaturedTradingCardsCarousel } from "@/components/quizzes/featured-trading-cards-carousel";

const HERO_SECTION_LIMIT = 5;

export async function FeaturedSection() {
    const session = await auth();
    const userId = session?.user?.id;

    const featuredListing = await getPublicQuizList(
        {
            isFeatured: true,
            limit: HERO_SECTION_LIMIT,
            page: 1,
        },
        {
            telemetryEnabled: false,
            telemetryUserId: userId,
        }
    );

    if (featuredListing.quizzes.length === 0) return null;

    return (
        <section>
            <FeaturedTradingCardsCarousel quizzes={featuredListing.quizzes} />
        </section>
    );
}

export function FeaturedSectionSkeleton() {
    return (
        <section className="mb-12 w-full lg:mb-24 flex gap-8 overflow-hidden">
            {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="w-full md:basis-1/2 lg:basis-1/2 shrink-0 aspect-[4/5] bg-muted/5 border border-border/50 animate-pulse" />
            ))}
        </section>
    );
}
