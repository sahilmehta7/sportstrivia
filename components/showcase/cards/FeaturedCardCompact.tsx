import Image from "next/image";
import { Play, Star, ChevronRight } from "lucide-react";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";

interface FeaturedCardCompactProps {
    quiz: PublicQuizListItem;
}

export function FeaturedCardCompact({ quiz }: FeaturedCardCompactProps) {
    return (
        <div className="group relative flex w-full max-w-sm mx-auto overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md dark:border-white/10">
            {/* Left Thumbnail */}
            <div className="relative w-32 shrink-0 overflow-hidden">
                <Image
                    src={quiz.descriptionImageUrl || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1000&auto=format&fit=crop"}
                    alt={quiz.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/30">
                    <Play className="w-8 h-8 text-white fill-white" />
                </div>
            </div>

            {/* Right Content */}
            <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {quiz.sport || "General"}
                        </span>
                        <div className="flex items-center gap-0.5 text-amber-500">
                            <Star className="h-3 w-3 fill-current" />
                            <span className="text-xs font-bold">{quiz.averageRating.toFixed(1)}</span>
                        </div>
                    </div>
                    <h3 className="mt-1 text-lg font-bold leading-tight group-hover:text-primary transition-colors">
                        {quiz.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {quiz.description || "No description available."}
                    </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs font-semibold text-primary">
                        {quiz._count.questionPool} Questions
                    </div>
                    <button className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
