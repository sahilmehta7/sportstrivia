"use client";

import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";
import { Trophy, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";

const arenas = [
    {
        sport: "Football",
        description: "The beautiful game. Test your knowledge of leagues, legends, and history.",
        quizzes: 24,
        rating: 4.8,
        color: "from-emerald-500 to-teal-400",
        glow: "shadow-neon-lime/20",
        href: "/quizzes?sport=Football"
    },
    {
        sport: "Basketball",
        description: "From NBA classics to streetball legends. Dunk into the deepest stats.",
        quizzes: 18,
        rating: 4.9,
        color: "from-orange-500 to-red-400",
        glow: "shadow-neon-orange/20",
        href: "/quizzes?sport=Basketball"
    },
    {
        sport: "Cricket",
        description: "The gentleman's game. Master the world of Test, ODI, and T20 trivia.",
        quizzes: 15,
        rating: 4.7,
        color: "from-blue-500 to-indigo-400",
        glow: "shadow-neon-cyan/20",
        href: "/quizzes?sport=Cricket"
    },
    {
        sport: "Tennis",
        description: "Grand slams and court masters. Ace every question in the arena.",
        quizzes: 12,
        rating: 4.6,
        color: "from-yellow-400 to-orange-400",
        glow: "shadow-neon-yellow/20",
        href: "/quizzes?sport=Tennis"
    }
];

export function QuickStartArena() {
    return (
        <section className="px-4 py-20 sm:px-6 lg:py-32 bg-black/20">
            <div className="mx-auto max-w-7xl">
                <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="max-w-2xl">
                        <h2 className={cn("text-4xl font-black tracking-tighter sm:text-6xl mb-4 uppercase", getGradientText("accent"))}>
                            CHOOSE YOUR <br /> INITIAL ARENA
                        </h2>
                        <p className="text-lg text-muted-foreground font-medium">
                            Don't wait for the tour. Jump straight into the action in your favorite category.
                        </p>
                    </div>
                    <Link href="/quizzes">
                        <ShowcaseButton variant="glass" size="lg" className="group">
                            VIEW PLAYBOOK
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </ShowcaseButton>
                    </Link>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {arenas.map((arena, index) => (
                        <Link key={index} href={arena.href} className="group">
                            <div className={cn(
                                "relative h-full rounded-[2.5rem] p-8 glass border-white/5 transition-all duration-500",
                                "group-hover:border-white/20 group-hover:-translate-y-2",
                                arena.glow
                            )}>
                                {/* Background Glow */}
                                <div className={cn("absolute inset-0 rounded-[2.5rem] bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity", arena.color)} />

                                <div className="relative z-10 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className={cn("rounded-2xl p-4 bg-white/5 border border-white/10 group-hover:border-white/30 transition-colors")}>
                                            <Trophy className={cn("h-8 w-8 bg-gradient-to-br bg-clip-text text-transparent", arena.color)} />
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                            <span className="text-xs font-black tracking-tighter">{arena.rating}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black tracking-tight mb-2 uppercase">
                                            {arena.sport}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-muted-foreground font-medium line-clamp-2">
                                            {arena.description}
                                        </p>
                                    </div>

                                    <div className="pt-4 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                            {arena.quizzes} MISSIONS
                                        </span>
                                        <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
