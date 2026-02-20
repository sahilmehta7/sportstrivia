import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";
import {
    Grid3X3,
    ArrowRight,
    Info,
    Clock,
    ShieldCheck,
    Users,
    Zap
} from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { cn } from "@/lib/utils";
import { getBlurCircles, getGradientText } from "@/lib/showcase-theme";
import { formatPlayerCount } from "@/lib/quiz-formatters";

interface GridDetailPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: GridDetailPageProps): Promise<Metadata> {
    const { slug } = await params;
    const grid = await db.gridQuiz.findUnique({
        where: { slug },
    });

    if (!grid) return { title: "Grid Not Found" };

    return {
        title: `${grid.title} | Immaculate Grid`,
        description: grid.description || "Can you solve this immaculate sports grid?",
    };
}

export default async function GridDetailPage({ params }: GridDetailPageProps) {
    const { slug } = await params;

    const grid = await db.gridQuiz.findUnique({
        where: { slug },
        include: {
            _count: {
                select: { attempts: true }
            }
        }
    });

    if (!grid || grid.status !== "PUBLISHED") {
        notFound();
    }

    const { circle1, circle2, circle3 } = getBlurCircles();
    const rows = (grid.rows as string[]) || [];
    const cols = (grid.cols as string[]) || [];
    const playersLabel = formatPlayerCount(grid._count.attempts);

    return (
        <main className="relative min-h-screen overflow-hidden pt-12 pb-24 lg:pt-20 bg-background">
            {/* Ambient Background Elements */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className={cn("absolute -left-[10%] top-[10%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle1)} />
                <div className={cn("absolute -right-[10%] top-[20%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle2)} />
                <div className={cn("absolute left-[20%] -bottom-[10%] h-[40%] w-[40%] rounded-full opacity-20 blur-[120px]", circle3)} />
            </div>

            <PageContainer>
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
                    {/* Main Content Area */}
                    <div className="flex-1 space-y-12">
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 dark:glass border border-border dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-primary shadow-neon-cyan/20">
                                    IMMACULATE GRID
                                </div>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 dark:glass border border-border dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-secondary shadow-neon-pink/20">
                                    {grid.sport || "ALL SPORTS"}
                                </div>
                            </div>

                            <h1 className={cn(
                                "text-4xl sm:text-6xl lg:text-8xl font-bold uppercase tracking-tighter leading-[0.9]",
                                getGradientText("editorial")
                            )}>
                                {grid.title}
                            </h1>

                            <p className="max-w-2xl text-lg text-muted-foreground font-medium leading-relaxed">
                                {grid.description || "Test your sports knowledge by linking legacy players to their achievements. Nine cells, nine correct answers, zero room for error."}
                            </p>

                            <div className="pt-4 flex flex-wrap gap-4">
                                <div className="flex flex-col gap-1 p-6 rounded-[2rem] bg-card border border-border dark:border-white/5 min-w-[140px]">
                                    <ShieldCheck className="h-5 w-5 text-primary mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Type</p>
                                    <p className="text-2xl font-black tracking-tighter uppercase">Immaculate</p>
                                </div>
                                <div className="flex flex-col gap-1 p-6 rounded-[2rem] bg-card border border-border dark:border-white/5 min-w-[140px]">
                                    <Grid3X3 className="h-5 w-5 text-secondary mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Layout</p>
                                    <p className="text-2xl font-black tracking-tighter uppercase">{grid.size}x{grid.size}</p>
                                </div>
                                <div className="flex flex-col gap-1 p-6 rounded-[2rem] bg-card border border-border dark:border-white/5 min-w-[140px]">
                                    <Users className="h-5 w-5 text-accent mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Contenders</p>
                                    <p className="text-2xl font-black tracking-tighter">{playersLabel}</p>
                                </div>
                            </div>

                            <div className="pt-8 flex flex-wrap gap-4">
                                <Link href={`/grids/${grid.slug}/play`} className="w-full sm:w-auto">
                                    <ShowcaseButton variant="neon" size="xl" className="w-full group">
                                        INITIALIZE GRID
                                        <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                                    </ShowcaseButton>
                                </Link>
                                <ShowcaseButton variant="glass" size="xl" className="w-full sm:w-auto">
                                    SHARE INTEL
                                </ShowcaseButton>
                            </div>
                        </div>


                    </div>

                    {/* Sidebar Stats Area */}
                    <aside className="w-full lg:w-[380px] space-y-8">
                        {/* Deployment Status */}
                        <div className="rounded-[2.5rem] p-8 bg-card border border-border dark:border-white/10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Zap className="h-5 w-5 text-secondary" />
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">Live Status</h3>
                                </div>
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-neon-lime" />
                            </div>

                            <div className="p-6 rounded-[2rem] bg-muted/50 dark:bg-white/5 border border-border dark:border-white/5 text-center space-y-2">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">CURRENT PHASE</p>
                                <div className="text-4xl font-black tracking-tighter">OPERATIONAL</div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 dark:bg-white/5 border border-border dark:border-white/5">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Estimated Playtime</p>
                                        <p className="text-sm font-bold uppercase tracking-tight text-foreground/80">4-6 Minutes</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 dark:bg-white/5 border border-border dark:border-white/5">
                                    <Info className="h-5 w-5 text-secondary" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Difficulty Index</p>
                                        <p className="text-sm font-bold uppercase tracking-tight text-foreground/80">Varies by Cell</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tactical Security Warning */}
                        <div className="flex items-center gap-4 p-6 rounded-[2rem] border border-border dark:border-white/5 text-muted-foreground bg-muted/20 dark:bg-white/[0.02]">
                            <Info className="h-5 w-5 shrink-0" />
                            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                WARNING: Grid integrity is highly sensitive. You have limited lives per attempt. Plan your rarity carefully.
                            </p>
                        </div>
                    </aside>
                </div>
            </PageContainer>
        </main>
    );
}
