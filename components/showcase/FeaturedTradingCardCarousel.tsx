import { getPublicQuizList } from "@/lib/services/public-quiz.service";
import { FeaturedCardTrading } from "@/components/showcase/cards/FeaturedCardTrading";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

export async function FeaturedTradingCardCarousel() {
    // Fetch only featured quizzes, or fallback to any quizzes if none are marked featured for demo
    const { quizzes } = await getPublicQuizList({ isFeatured: true, limit: 10 });

    // If no featured quizzes, fallback to normal list for the showcase to ensure we have data to show
    const displayQuizzes = quizzes.length > 0
        ? quizzes
        : (await getPublicQuizList({ limit: 10 })).quizzes;

    if (displayQuizzes.length === 0) {
        return (
            <div className="w-full text-center p-8 text-muted-foreground">
                No quizzes available to display in carousel.
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto px-12">
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                    {displayQuizzes.map((quiz) => (
                        <CarouselItem key={quiz.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                            <div className="p-1">
                                <FeaturedCardTrading quiz={quiz} />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </div>
    );
}
