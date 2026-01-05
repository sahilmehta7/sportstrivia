import Image from "next/image";
import { Trophy, Clock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";

interface FeaturedCardHeroProps {
    quiz: PublicQuizListItem;
}

export function FeaturedCardHero({ quiz }: FeaturedCardHeroProps) {
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-background shadow-xl dark:border dark:border-white/10 w-full max-w-sm mx-auto">
            {/* Background Image with Gradient Overlay */}
            <div className="absolute inset-0 z-0 h-full w-full">
                <Image
                    src={quiz.descriptionImageUrl || "https://images.unsplash.com/photo-1579952363873-27f3bde9be51?q=80&w=1000&auto=format&fit=crop"}
                    alt={quiz.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex h-[420px] flex-col justify-end p-6 text-white">
                {/* Top Badge */}
                <div className="absolute left-6 top-6">
                    <span className="inline-flex items-center rounded-full bg-primary/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground backdrop-blur-sm">
                        {quiz.sport || "Featured"}
                    </span>
                </div>

                <div className="space-y-4">
                    <div>
                        <h2 className="text-3xl font-black uppercase leading-tight tracking-tight">
                            {quiz.title}
                        </h2>
                        <p className="mt-2 line-clamp-2 text-sm text-gray-300">
                            {quiz.description || "Test your knowledge in this featured quiz."}
                        </p>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between border-t border-white/20 pt-4 text-xs font-medium text-gray-300">
                        <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{Math.ceil((quiz.duration || 300) / 60)} mins</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-primary" />
                            <span>{quiz._count.questionPool} Questions</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-primary" />
                            <span>{quiz._count.attempts} Plays</span>
                        </div>
                    </div>

                    <Button className="w-full gap-2 rounded-xl text-base font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40">
                        Play Now
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
