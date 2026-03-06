import Image from "next/image";
import { ArrowRight, Play } from "lucide-react";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";
import { cn } from "@/lib/utils";


interface FeaturedCardTradingProps {
    quiz: PublicQuizListItem;
}

export function FeaturedCardTrading({ quiz }: FeaturedCardTradingProps) {
    const year = new Date(quiz.createdAt).getFullYear();

    return (
        <div className="relative w-full group overflow-hidden">
            <div className={cn(
                "relative flex flex-col bg-background border-2 border-foreground/5",
                "transition-all duration-300 group-hover:border-foreground group-hover:shadow-athletic"
            )}>
                {/* Header Information */}
                <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start pointer-events-none p-6">
                    <div className="text-[10px] font-bold tracking-widest text-foreground/40 uppercase bg-background px-3 py-1">
                        EST. {year}
                    </div>
                </div>

                {/* Media Section */}
                <div className="relative aspect-[4/3] w-full overflow-hidden border-b-2 border-foreground/5">
                    <Image
                        src={quiz.descriptionImageUrl || "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1000&auto=format&fit=crop"}
                        alt={quiz.title}
                        fill
                        className="object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />

                    {/* Play Button Appearance on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <div className="bg-accent p-6 text-white shadow-athletic translate-y-4 group-hover:translate-y-0">
                            <Play className="h-8 w-8 fill-current" />
                        </div>
                    </div>

                    {/* Category Overlay */}
                    <div className="absolute bottom-6 left-8 flex items-center gap-3">
                        <div className="h-px w-8 bg-accent" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-foreground">
                            {quiz.sport || "Quiz"}
                        </span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-10 flex flex-col gap-8">
                    <div className="space-y-4">
                        <h2 className={cn(
                            "text-4xl font-bold uppercase tracking-tighter leading-[0.85] font-['Barlow_Condensed',sans-serif] line-clamp-2",
                            "group-hover:text-accent transition-colors"
                        )}>
                            {quiz.title}
                        </h2>
                        <div className="h-1 w-12 bg-foreground/10" />
                    </div>

                    <div className="flex items-center justify-start">
                        <div className="inline-flex items-center gap-3 bg-accent px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-athletic transition-all group-hover:translate-x-1 group-hover:bg-accent/90">
                            <span>Take The Quiz</span>
                            <ArrowRight className="h-4 w-4" />
                        </div>
                    </div>
                </div>

                {/* Athletic Border Stripe */}
                <div className="h-2 w-full flex">
                    <div className="h-full flex-1 bg-accent/20" />
                    <div className="h-full flex-1 bg-accent/40" />
                    <div className="h-full flex-1 bg-accent/60" />
                    <div className="h-full flex-1 bg-accent/80" />
                    <div className="h-full flex-1 bg-accent" />
                </div>
            </div>
        </div>
    );
}
