import { Flame, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";

interface FeaturedCardModernProps {
    quiz: PublicQuizListItem;
}

export function FeaturedCardModern({ quiz }: FeaturedCardModernProps) {
    return (
        <div className="group relative overflow-hidden rounded-3xl bg-black w-full max-w-sm mx-auto shadow-2xl transition-all hover:scale-[1.02]">
            {/* Dynamic Background */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-60 transition-opacity duration-500 group-hover:opacity-40 grayscale group-hover:grayscale-0"
                style={{ backgroundImage: `url('${quiz.descriptionImageUrl || "https://images.unsplash.com/photo-1540747913346-19e32dc3e96e?q=80&w=1000&auto=format&fit=crop"}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 via-transparent to-orange-900/80 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* Content Layer */}
            <div className="relative flex h-[380px] flex-col justify-between p-7 text-white">
                <div className="flex justify-between items-start">
                    <Badge variant="secondary" className="bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white/20">
                        {quiz.sport || "Trending"}
                    </Badge>
                    <div className="p-2 rounded-full bg-white/10 backdrop-blur-md">
                        <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                            {quiz.title}
                        </h2>
                        <div className="h-1 w-12 bg-orange-500 rounded-full" />
                    </div>

                    <p className="font-medium text-gray-300 line-clamp-2">
                        {quiz.description || "Experience the thrill of this fast-paced sports quiz."}
                    </p>

                    <button className="w-full mt-4 group/btn flex items-center justify-between rounded-xl bg-white p-4 text-black transition-all hover:bg-orange-500 hover:text-white">
                        <span className="font-bold uppercase tracking-wide">Start Challenge</span>
                        <ArrowUpRight className="h-5 w-5 transition-transform group-hover/btn:rotate-45" />
                    </button>
                </div>
            </div>
        </div>
    );
}
