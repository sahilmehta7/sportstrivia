"use client";

import { motion } from "framer-motion";
import { Grid3X3, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";
import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";

interface GridDailyWidgetProps {
    grid: {
        id: string;
        title: string;
        slug: string;
        sport: string | null;
        rows: any;
        cols: any;
        size: number;
    };
}

export function GridDailyWidget({ grid }: GridDailyWidgetProps) {
    const rows = (grid.rows as string[]) || [];
    const cols = (grid.cols as string[]) || [];

    return (
        <section className="px-4 py-20 sm:px-6 lg:py-32">
            <div className="mx-auto max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="group relative overflow-hidden rounded-[3rem] border border-border dark:border-white/10 bg-card dark:bg-[#020817] p-1"
                >
                    {/* Animated Glow Backdrops */}
                    <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/20 blur-[120px] transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-secondary/20 blur-[120px] transition-transform duration-1000 group-hover:scale-110" />

                    <div className="relative flex flex-col lg:flex-row items-stretch rounded-[2.9rem] bg-card/80 dark:bg-[#020817]/80 backdrop-blur-3xl overflow-hidden">

                        {/* Left: Info Section */}
                        <div className="flex-1 p-8 sm:p-12 lg:p-16 space-y-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 dark:bg-white/5 border border-border dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-primary">
                                        <Zap className="h-3 w-3 fill-primary" />
                                        LIVE NOW
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                        IMMACULATE GRID SERIES
                                    </span>
                                </div>

                                <h2 className={cn(
                                    "text-4xl sm:text-6xl font-bold uppercase tracking-tighter leading-[0.9]",
                                    getGradientText("accent")
                                )}>
                                    TODAY&apos;S <br /> TACTICAL GRID
                                </h2>

                                <p className="text-lg text-muted-foreground font-medium max-w-md leading-relaxed">
                                    {grid.title}: {grid.sport || "All Sports"} edition. Link legendary athletes to their franchises and accolades.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-muted/50 dark:bg-white/5 border border-border dark:border-white/5">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                    <span className="text-sm font-bold uppercase tracking-tight text-foreground/80">IMMUTABLE LIVES</span>
                                </div>
                                <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-muted/50 dark:bg-white/5 border border-border dark:border-white/5">
                                    <Grid3X3 className="h-5 w-5 text-secondary" />
                                    <span className="text-sm font-bold uppercase tracking-tight text-foreground/80">{grid.size}x{grid.size} MATRIX</span>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-wrap gap-4">
                                <Link href={`/grids/${grid.slug}`}>
                                    <ShowcaseButton variant="neon" size="xl" className="group">
                                        INITIALIZE MISSION
                                        <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-2 transition-transform" />
                                    </ShowcaseButton>
                                </Link>
                                <Link href="/grids">
                                    <ShowcaseButton variant="glass" size="xl">
                                        VIEW ARCHIVES
                                    </ShowcaseButton>
                                </Link>
                            </div>
                        </div>

                        {/* Right: Visual Briefing Preview */}
                        <div className="lg:w-[460px] bg-muted/30 dark:bg-white/[0.02] border-l border-border dark:border-white/5 p-8 sm:p-12 flex flex-col justify-center gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Row Constellations</h3>
                                    <div className="space-y-2">
                                        {rows.slice(0, 3).map((row, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border dark:bg-white/5 dark:border-white/5 backdrop-blur-sm shadow-sm dark:shadow-none">
                                                <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">R{i + 1}</div>
                                                <span className="text-sm font-bold tracking-tight uppercase truncate text-foreground/80">{row}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Column Vectors</h3>
                                    <div className="space-y-2">
                                        {cols.slice(0, 3).map((col, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border dark:bg-white/5 dark:border-white/5 backdrop-blur-sm shadow-sm dark:shadow-none">
                                                <div className="h-5 w-5 rounded bg-secondary/20 flex items-center justify-center text-[10px] font-black text-secondary">C{i + 1}</div>
                                                <span className="text-sm font-bold tracking-tight uppercase truncate text-foreground/80">{col}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 rounded-[2rem] border border-border dark:border-white/5 bg-muted/20 dark:bg-gradient-to-br dark:from-white/5 dark:to-transparent">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 italic">Intelligence Report</p>
                                <p className="text-[11px] leading-relaxed text-muted-foreground font-medium">
                                    This grid utilizes advanced rarity multi-scoring. Solving for rare players yields higher rank dividends.
                                </p>
                            </div>
                        </div>

                    </div>
                </motion.div>
            </div>
        </section>
    );
}
