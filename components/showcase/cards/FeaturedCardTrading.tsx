import Image from "next/image";
import { Star, ShieldCheck, Zap, Trophy } from "lucide-react";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";

interface FeaturedCardTradingProps {
    quiz: PublicQuizListItem;
}

export function FeaturedCardTrading({ quiz }: FeaturedCardTradingProps) {
    // Derive "Trading Card" stats from real data
    const year = new Date(quiz.createdAt).getFullYear();

    const rarityMap = {
        EASY: { label: "COMMON", color: "text-slate-500", fill: "fill-slate-500" },
        MEDIUM: { label: "RARE", color: "text-blue-500", fill: "fill-blue-500" },
        HARD: { label: "LEGENDARY", color: "text-yellow-400", fill: "fill-yellow-400" },
    };

    const rarity = rarityMap[quiz.difficulty] || rarityMap.MEDIUM;

    // Calculate a "Power Level" or XP based on questions and difficulty
    const baseXP = quiz._count.questionPool * 10;
    const multiplier = quiz.difficulty === "HARD" ? 2 : quiz.difficulty === "MEDIUM" ? 1.5 : 1;
    const xp = Math.round(baseXP * multiplier);

    // Map difficulty to a 0-99 stat for the "DEF" (Defense/Difficulty) stat
    const manualDifficultyStat = quiz.difficulty === "HARD" ? 94 : quiz.difficulty === "MEDIUM" ? 75 : 45;

    return (
        <div className="relative w-full max-w-sm mx-auto aspect-[3/4] rounded-xl bg-gradient-to-tr from-slate-200 to-slate-100 p-2 shadow-xl ring-1 ring-black/5 dark:from-slate-800 dark:to-slate-900 dark:ring-white/10">
            <div className="h-full w-full rounded-lg bg-background p-1 border-4 border-double border-muted">
                <div className="relative h-full w-full overflow-hidden rounded border border-muted bg-slate-50 dark:bg-slate-950 flex flex-col">
                    {/* Header */}
                    <div className="absolute top-0 left-0 right-0 z-10 flex justify-between p-3 bg-gradient-to-b from-black/60 to-transparent text-white">
                        <div className={`flex items-center gap-1 font-mono text-xs ${rarity.color}`}>
                            <Star className={`w-3 h-3 ${rarity.fill}`} />
                            <span>{rarity.label}</span>
                        </div>
                        <div className="font-bold tracking-widest text-xs opacity-80">{year} SERIES</div>
                    </div>

                    {/* Image */}
                    <div className="flex-1 relative min-h-[50%]">
                        <Image
                            src={quiz.descriptionImageUrl || "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1000&auto=format&fit=crop"}
                            alt={quiz.title}
                            fill
                            className="object-cover grayscale contrast-125"
                        />
                        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
                    </div>

                    {/* Stats Section */}
                    <div className="relative z-10 p-4 pb-6 mt-auto">
                        <div className="mb-4 text-center">
                            <h2 className="text-xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 scale-y-110 line-clamp-1">
                                {quiz.title}
                            </h2>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">{quiz.sport || "General"} Trivia</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="rounded bg-muted/50 p-2">
                                <ShieldCheck className="mx-auto h-4 w-4 text-primary mb-1" />
                                <div className="text-[10px] text-muted-foreground uppercase">DIFF</div>
                                <div className="font-bold text-sm">{manualDifficultyStat}</div>
                            </div>
                            <div className="rounded bg-muted/50 p-2">
                                <Zap className="mx-auto h-4 w-4 text-yellow-500 mb-1" />
                                <div className="text-[10px] text-muted-foreground uppercase">QTS</div>
                                <div className="font-bold text-sm">{quiz._count.questionPool}</div>
                            </div>
                            <div className="rounded bg-muted/50 p-2">
                                <Trophy className="mx-auto h-4 w-4 text-purple-500 mb-1" />
                                <div className="text-[10px] text-muted-foreground uppercase">XP</div>
                                <div className="font-bold text-sm">{xp}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
