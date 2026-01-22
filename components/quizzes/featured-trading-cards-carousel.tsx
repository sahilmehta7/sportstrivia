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
import { cn } from "@/lib/utils";

interface FeaturedTradingCardsCarouselProps {
    quizzes: PublicQuizListItem[];
}

export function FeaturedTradingCardsCarousel({ quizzes }: FeaturedTradingCardsCarouselProps) {
    if (quizzes.length === 0) {
        return null;
    }

    return (
        <section className="mb-12 w-full max-w-7xl mx-auto px-4 md:px-8 lg:mb-24">
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full"
            >
                <CarouselContent className="-ml-8">
                    {quizzes.map((quiz) => (
                        <CarouselItem key={quiz.id} className="pl-8 md:basis-1/2 lg:basis-1/2">
                            <Link href={`/quizzes/${quiz.slug}`} className="block">
                                <FeaturedCardTrading quiz={quiz} />
                            </Link>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {/* Athletic Navigation */}
                <div className="absolute -bottom-16 right-8 flex gap-2">
                    <CarouselPrevious className="static translate-y-0 h-12 w-12 rounded-none bg-background border-2 border-foreground/5 hover:border-foreground transition-all" />
                    <CarouselNext className="static translate-y-0 h-12 w-12 rounded-none bg-foreground text-background hover:bg-foreground/90 transition-all shadow-athletic" />
                </div>
            </Carousel>
        </section>
    );
}
