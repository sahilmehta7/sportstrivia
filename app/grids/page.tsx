import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";
import { Grid3X3, Play, Trophy, Users, ShieldCheck, ArrowRight, Zap, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/shared/PageContainer";
import { cn } from "@/lib/utils";
import { getBlurCircles, getGradientText } from "@/lib/showcase-theme";
import { formatPlayerCount } from "@/lib/quiz-formatters";
import * as motion from "framer-motion/client";
import { GridTutorialCard } from "@/components/grid/GridTutorialCard";

export const dynamic = "force-dynamic";

function GridsSkeleton() {
    return (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-[400px] rounded-[2.5rem] glass border border-white/5 p-8 animate-pulse">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-3 w-full">
                            <Skeleton className="h-8 w-3/4 bg-white/5" />
                            <Skeleton className="h-4 w-1/4 bg-white/5" />
                        </div>
                        <Skeleton className="h-8 w-8 rounded-xl bg-white/5" />
                    </div>
                    <div className="space-y-4 mb-8">
                        <Skeleton className="h-20 w-full bg-white/5 rounded-2xl" />
                    </div>
                    <div className="flex gap-2 mb-8">
                        {[1, 2, 3].map(j => <Skeleton key={j} className="h-6 w-12 bg-white/5 rounded-full" />)}
                    </div>
                    <Skeleton className="h-14 w-full bg-white/5 rounded-2xl" />
                </div>
            ))}
        </div>
    );
}

async function GridsList() {
    const grids = await db.gridQuiz.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: { attempts: true },
            },
        },
    });

    if (grids.length === 0) {
        return (
            <div className="text-center py-24 glass rounded-[3rem] border border-white/5 bg-white/[0.02]">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h3 className="text-2xl font-bold text-muted-foreground uppercase tracking-tighter">No grids available</h3>
                <p className="text-muted-foreground/60 max-w-xs mx-auto mt-2">Check back later for fresh tactical challenges.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {grids.map((grid, index) => {
                const rows = (grid.rows as string[]) || [];
                const cols = (grid.cols as string[]) || [];
                const playersLabel = formatPlayerCount(grid._count.attempts);

                return (
                    <motion.div
                        key={grid.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative"
                    >
                        <Link href={`/grids/${grid.slug}`} className="block h-full">
                            <div className="h-full rounded-[2.5rem] p-8 bg-card border border-border dark:border-white/5 transition-all duration-500 group-hover:border-primary/30 group-hover:bg-accent/5 dark:group-hover:bg-white/[0.04] flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-1">
                                        <h3 className="text-2xl font-black tracking-tight uppercase group-hover:text-primary transition-colors">
                                            {grid.title}
                                        </h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                            {grid.sport || "All Sports"}
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/30 transition-all">
                                        <Grid3X3 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground font-medium line-clamp-2 mb-8 flex-grow">
                                    {grid.description || "Link players to the correct rows and columns to solve the grid."}
                                </p>

                                {/* Tactical Axis Preview */}
                                <div className="space-y-4 mb-8">
                                    <div className="flex flex-wrap gap-2">
                                        {rows.slice(0, 2).map((row, i) => (
                                            <span key={i} className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary uppercase whitespace-nowrap">
                                                {row}
                                            </span>
                                        ))}
                                        {rows.length > 2 && <span className="text-[9px] font-bold text-muted-foreground/40 self-center">+{rows.length - 2}</span>}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between py-4 border-t border-border dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-6">
                                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {playersLabel}</span>
                                    <span>{new Date(grid.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                </div>

                                <ShowcaseButton variant="neon" size="lg" className="w-full relative overflow-hidden group/btn">
                                    TACTICAL ENTRY
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                </ShowcaseButton>
                            </div>
                        </Link>
                    </motion.div>
                );
            })}
        </div>
    );
}

export default async function GridsLobbyPage() {
    const { circle1, circle2, circle3 } = getBlurCircles();

    // Fetch aggregate stats for the header
    const [totalMissions, totalAttempts] = await Promise.all([
        db.gridQuiz.count({ where: { status: "PUBLISHED" } }),
        db.gridAttempt.count()
    ]);

    const contendersLabel = formatPlayerCount(totalAttempts);

    return (
        <main className="relative min-h-screen pt-4 pb-24 lg:pt-8 bg-background">
            {/* Ambient Effects */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className={cn("absolute -left-[10%] top-[10%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle1)} />
                <div className={cn("absolute -right-[10%] top-[20%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle2)} />
                <div className={cn("absolute left-[20%] -bottom-[10%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle3)} />
            </div>

            <PageContainer className="pt-2 md:pt-4">
                <div className="space-y-12 mt-4">
                    {/* Tactical Header */}
                    <div className="flex flex-col lg:flex-row gap-8 lg:items-center">
                        <div className="flex-1 space-y-4 text-center lg:text-left">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 border border-border px-4 py-1.5 bg-muted/50 dark:bg-muted/30">
                                    <Zap className="h-4 w-4 text-accent" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">IMMACULATE GRID SERIES</span>
                                </div>

                                <h1 className={cn(
                                    "text-6xl font-bold tracking-tighter lg:text-8xl uppercase leading-[0.85] font-['Barlow_Condensed',sans-serif]",
                                    getGradientText("editorial")
                                )}>
                                    TACTICAL <br className="hidden lg:block" /> DATA GRIDS
                                </h1>

                                <p className="max-w-xl mx-auto lg:mx-0 text-xl text-muted-foreground font-semibold uppercase tracking-tight leading-tight">
                                    Link legends across the matrix. One error ends the mission.
                                </p>

                                <div className="flex flex-wrap justify-center lg:justify-start gap-12 pt-6 border-t border-border dark:border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">Grid Missions</p>
                                        <p className="text-4xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif]">{totalMissions}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">Total Contenders</p>
                                        <p className="text-4xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif]">{contendersLabel}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">Rarity Bonus</p>
                                        <p className="text-4xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif] text-secondary">ACTIVE</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Interactive Tutorial Card */}
                        <div className="flex-1 flex justify-center lg:justify-end">
                            <GridTutorialCard />
                        </div>
                    </div>

                    {/* Grid List with Suspension */}
                    <div className="space-y-12">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b-2 border-foreground/5 pb-8">
                            <div className="space-y-4">
                                <h2 className={cn(
                                    "text-5xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif]",
                                    getGradientText("editorial")
                                )}>
                                    OPERATIONAL MATRICES
                                </h2>
                                <p className="max-w-xl text-lg text-muted-foreground font-semibold uppercase tracking-tight leading-tight">
                                    Select your theater of operation. Link icons to their legends.
                                </p>
                            </div>
                        </div>

                        <Suspense fallback={<GridsSkeleton />}>
                            <GridsList />
                        </Suspense>
                    </div>
                </div>
            </PageContainer>
        </main>
    );
}
