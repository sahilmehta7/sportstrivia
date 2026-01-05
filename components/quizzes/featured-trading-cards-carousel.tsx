"use client";

import Link from "next/link";
import { FeaturedCardTrading } from "@/components/showcase/cards/FeaturedCardTrading";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";

interface FeaturedTradingCardsCarouselProps {
    quizzes: PublicQuizListItem[];
}

export function FeaturedTradingCardsCarousel({ quizzes }: FeaturedTradingCardsCarouselProps) {
    if (quizzes.length === 0) {
        return null;
    }

    return (
        <section className="mb-6 w-full max-w-5xl mx-auto md:px-12 md:mb-12">
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-2 md:-ml-4">
                    {quizzes.map((quiz) => (
                        <CarouselItem key={quiz.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                            <div className="p-1">
                                <Link href={`/quizzes/${quiz.slug}`}>
                                    <FeaturedCardTrading quiz={quiz} />
                                </Link>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
        </section>
    );
}
