
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
        <div className="w-full h-[300px] bg-muted/5 rounded-xl animate-pulse border border-border/50" />
    );
}
