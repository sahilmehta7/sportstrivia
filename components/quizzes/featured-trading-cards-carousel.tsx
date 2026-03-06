"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FeaturedCardTrading } from "@/components/showcase/cards/FeaturedCardTrading";
import {
    type CarouselApi,
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";


interface FeaturedTradingCardsCarouselProps {
    quizzes: PublicQuizListItem[];
}

export function FeaturedTradingCardsCarousel({ quizzes }: FeaturedTradingCardsCarouselProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        if (!api) {
            return;
        }

        const updateSelectedIndex = () => {
            setSelectedIndex(api.selectedScrollSnap());
        };

        updateSelectedIndex();
        api.on("select", updateSelectedIndex);
        api.on("reInit", updateSelectedIndex);

        return () => {
            api.off("select", updateSelectedIndex);
            api.off("reInit", updateSelectedIndex);
        };
    }, [api]);

    if (quizzes.length === 0) {
        return null;
    }

    return (
        <section className="mb-12 w-full max-w-7xl mx-auto px-4 md:px-8 lg:mb-24">
            <Carousel
                setApi={setApi}
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full"
            >
                <div className="mb-4 flex items-center justify-between md:hidden">
                    <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground/70">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Swipe featured</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                        {quizzes.map((quiz, index) => (
                            <span
                                key={quiz.id}
                                className={cn(
                                    "h-1.5 rounded-full bg-foreground/20 transition-all",
                                    index === selectedIndex ? "w-6 bg-accent" : "w-1.5"
                                )}
                            />
                        ))}
                    </div>
                </div>

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
                <div className="absolute -bottom-16 right-8 hidden gap-2 md:flex">
                    <CarouselPrevious className="static translate-y-0 h-12 w-12 rounded-none bg-background border-2 border-foreground/5 hover:border-foreground transition-all" />
                    <CarouselNext className="static translate-y-0 h-12 w-12 rounded-none bg-foreground text-background hover:bg-foreground/90 transition-all shadow-athletic" />
                </div>
            </Carousel>
        </section>
    );
}
