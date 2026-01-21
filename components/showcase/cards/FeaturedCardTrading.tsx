import Image from "next/image";
import { Star, ShieldCheck, Zap, Trophy, TrendingUp } from "lucide-react";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";

interface FeaturedCardTradingProps {
    quiz: PublicQuizListItem;
}

export function FeaturedCardTrading({ quiz }: FeaturedCardTradingProps) {
    const year = new Date(quiz.createdAt).getFullYear();

    const rarityMap = {
        EASY: {
            label: "COMMON",
            color: "text-emerald-400",
            glow: "shadow-neon-lime/20",
            border: "border-emerald-500/30",
            bg: "bg-emerald-500/5"
        },
        MEDIUM: {
            label: "RARE",
            color: "text-cyan-400",
            glow: "shadow-neon-cyan/20",
            border: "border-cyan-500/30",
            bg: "bg-cyan-500/5"
        },
        HARD: {
            label: "LEGENDARY",
            color: "text-magenta-400",
            glow: "shadow-neon-magenta/20",
            border: "border-magenta-500/30",
            bg: "bg-magenta-500/5"
        },
    };

    const rarity = rarityMap[quiz.difficulty] || rarityMap.MEDIUM;

    const baseXP = quiz._count.questionPool * 10;
    const multiplier = quiz.difficulty === "HARD" ? 2 : quiz.difficulty === "MEDIUM" ? 1.5 : 1;
    const xp = Math.round(baseXP * multiplier);
    const manualDifficultyStat = quiz.difficulty === "HARD" ? 94 : quiz.difficulty === "MEDIUM" ? 75 : 45;

    return (
        <div className={cn(
            "relative w-full max-w-sm mx-auto aspect-[3/4] rounded-[2.5rem] p-[2px] transition-all duration-500 shadow-glass-lg",
            "bg-gradient-to-br from-white/20 via-white/5 to-transparent hover:scale-[1.03] group",
            rarity.glow
        )}>
            <div className="h-full w-full rounded-[2.4rem] glass-elevated overflow-hidden flex flex-col">
                {/* Header Overlay */}
                <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-start pointer-events-none">
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1 rounded-full glass border border-white/10 shadow-sm",
                        rarity.color
                    )}>
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{rarity.label}</span>
                    </div>
                    <div className="text-[10px] font-black tracking-widest text-white/40 uppercase">
                        {year} EDITION
                    </div>
                </div>

                {/* Media Section */}
                <div className="relative flex-1 min-h-[50%] overflow-hidden">
                    <Image
                        src={quiz.descriptionImageUrl || "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1000&auto=format&fit=crop"}
                        alt={quiz.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

                    {/* Decorative Sport Badge */}
                    <div className="absolute bottom-4 left-6">
                        <span className="px-3 py-1 rounded-lg glass-elevated border-white/10 text-[10px] font-black uppercase tracking-widest text-primary shadow-neon-cyan/20">
                            {quiz.sport || "Arena"}
                        </span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="relative z-10 p-6 sm:p-8 flex flex-col gap-6">
                    <div className="space-y-2">
                        <h2 className={cn(
                            "text-2xl font-black uppercase tracking-tighter leading-tight line-clamp-2",
                            getGradientText("neon")
                        )}>
                            {quiz.title}
                        </h2>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1 text-center">
                            <div className="h-10 w-10 mx-auto rounded-xl glass border border-white/10 flex items-center justify-center">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                            </div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">POW</p>
                            <p className="text-sm font-black tracking-widest">{manualDifficultyStat}</p>
                        </div>
                        <div className="space-y-1 text-center">
                            <div className="h-10 w-10 mx-auto rounded-xl glass border border-white/10 flex items-center justify-center">
                                <Zap className="h-5 w-5 text-secondary" />
                            </div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">OPS</p>
                            <p className="text-sm font-black tracking-widest">{quiz._count.questionPool}</p>
                        </div>
                        <div className="space-y-1 text-center">
                            <div className="h-10 w-10 mx-auto rounded-xl glass border border-white/10 flex items-center justify-center">
                                <TrendingUp className="h-5 w-5 text-accent" />
                            </div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">XP</p>
                            <p className="text-sm font-black tracking-widest">{xp}</p>
                        </div>
                    </div>
                </div>

                {/* Animated progress bar at bottom */}
                <div className={cn("h-1 w-0 group-hover:w-full transition-all duration-700", rarity.color.replace('text-', 'bg-'))} />
            </div>
        </div>
    );
}
