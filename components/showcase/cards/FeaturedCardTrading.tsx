import Image from "next/image";
import { ShieldCheck, Zap, TrendingUp, ShieldAlert, Play } from "lucide-react";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

interface FeaturedCardTradingProps {
    quiz: PublicQuizListItem;
}

export function FeaturedCardTrading({ quiz }: FeaturedCardTradingProps) {
    const year = new Date(quiz.createdAt).getFullYear();

    const difficultyMap = {
        EASY: {
            label: "LEVEL 01 / AMATEUR",
            color: "text-blue-500",
            bg: "bg-blue-500/5",
            border: "border-blue-500/20"
        },
        MEDIUM: {
            label: "LEVEL 02 / PROFESSIONAL",
            color: "text-accent",
            bg: "bg-accent/5",
            border: "border-accent/20"
        },
        HARD: {
            label: "LEVEL 03 / ELITE",
            color: "text-primary",
            bg: "bg-primary/5",
            border: "border-primary/20"
        },
    };

    const level = difficultyMap[quiz.difficulty] || difficultyMap.MEDIUM;

    const baseXP = quiz._count.questionPool * 10;
    const multiplier = quiz.difficulty === "HARD" ? 2 : quiz.difficulty === "MEDIUM" ? 1.5 : 1;
    const calculatedXP = Math.round(baseXP * multiplier);
    const xp = quiz.completionBonus || calculatedXP;

    // Derived IQ Rank: difficulty base + passing score weight
    const difficultyBase = quiz.difficulty === "HARD" ? 9.0 : quiz.difficulty === "MEDIUM" ? 7.5 : 5.0;
    const passingScoreWeight = (quiz.passingScore - 70) / 20; // Normalizing passing score impact
    const scoreRank = (difficultyBase + passingScoreWeight).toFixed(1);

    return (
        <div className="relative w-full group overflow-hidden">
            <div className={cn(
                "relative flex flex-col bg-background border-2 border-foreground/5",
                "transition-all duration-300 group-hover:border-foreground group-hover:shadow-athletic"
            )}>
                {/* Header Information */}
                <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start pointer-events-none p-6">
                    <div className="flex items-center gap-2 bg-foreground px-4 py-2 text-background text-[10px] font-bold uppercase tracking-[0.2em]">
                        <ShieldAlert className="h-3 w-3 text-accent" />
                        {level.label}
                    </div>
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
                            {quiz.sport || "Arena"}
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

                    {/* Performance Stats Overlay */}
                    <div className="grid grid-cols-2 gap-px bg-foreground/5 border border-foreground/5">
                        <div className="bg-background p-6 space-y-2">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-accent" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">IQ Rank</span>
                            </div>
                            <p className="text-3xl font-bold tracking-tighter font-['Barlow_Condensed',sans-serif]">{scoreRank}</p>
                        </div>
                        <div className="bg-background p-6 space-y-2">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-accent" />
                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">XP Yield</span>
                            </div>
                            <p className="text-3xl font-bold tracking-tighter font-['Barlow_Condensed',sans-serif]">{xp}</p>
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
