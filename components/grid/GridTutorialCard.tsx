"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, Target, Search, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";
import { useState, useEffect } from "react";

export function GridTutorialCard() {
    const [step, setStep] = useState(0); // 0: Idle, 1: Scan Row, 2: Scan Col, 3: Match, 4: Reveal, 5: Reset

    useEffect(() => {
        const timer = setInterval(() => {
            setStep((prev) => (prev + 1) % 6);
        }, 2000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative group w-full max-w-[400px] aspect-square rounded-[3rem] p-1 bg-gradient-to-br from-primary/20 to-transparent">
            {/* Main Container */}
            <div className="relative h-full w-full rounded-[2.9rem] bg-card dark:bg-[#020817] border border-border dark:border-white/5 overflow-hidden flex flex-col p-6">

                {/* Header / Info */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Logic Simulation</span>
                    </div>
                    <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-bold text-primary">
                        STEP {Math.min(step + 1, 4)}/4
                    </div>
                </div>

                {/* The Mini Grid (2x2) */}
                <div className="relative flex-1 grid grid-cols-2 grid-rows-2 gap-3">
                    {/* Top Left: Spacer/Empty */}
                    <div className="rounded-2xl border border-dashed border-border dark:border-white/5 flex items-center justify-center">
                        <Target className="h-6 w-6 text-muted-foreground/20" />
                    </div>

                    {/* Top Right: Column Label (MVP) */}
                    <div className={cn(
                        "rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-500",
                        step === 2 ? "bg-secondary/20 border-secondary/50" : "bg-muted dark:bg-white/5 border-transparent dark:border-white/5"
                    )}>
                        <Zap className={cn("h-5 w-5 mb-1", step === 2 ? "text-secondary" : "text-muted-foreground")} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/80">MVP</span>
                    </div>

                    {/* Bottom Left: Row Label (LAKERS) */}
                    <div className={cn(
                        "rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-500",
                        step === 1 ? "bg-primary/20 border-primary/50" : "bg-muted dark:bg-white/5 border-transparent dark:border-white/5"
                    )}>
                        <span className="text-[10px] font-black uppercase tracking-widest text-center px-2 text-foreground/80">LAKERS</span>
                    </div>

                    {/* Bottom Right: The Solve Cell */}
                    <div className={cn(
                        "rounded-2xl relative border-2 transition-all duration-1000 flex items-center justify-center overflow-hidden",
                        step >= 3 ? "border-primary shadow-neon-blue/20 bg-primary/5" : "border-border dark:border-white/10 bg-muted/50 dark:bg-black/40",
                        step === 3 && "animate-pulse"
                    )}>
                        {/* Scanning Lines */}
                        <AnimatePresence>
                            {step === 1 && (
                                <motion.div
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "100%" }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-y-0 w-1 bg-primary/50 shadow-neon-blue"
                                />
                            )}
                            {step === 2 && (
                                <motion.div
                                    initial={{ y: "-100%" }}
                                    animate={{ y: "100%" }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-x-0 h-1 bg-secondary/50 shadow-neon-green"
                                />
                            )}
                        </AnimatePresence>

                        {/* Content */}
                        {step < 4 ? (
                            <div className="text-xl font-bold font-['Barlow_Condensed',sans-serif] text-foreground/10 dark:text-white/20">?</div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center"
                            >
                                <span className="block text-sm font-black uppercase tracking-tighter text-foreground dark:text-white">KOBE BRYANT</span>
                                <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/20 text-[8px] font-black text-primary">
                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                    RARITY: 0.1%
                                </div>
                            </motion.div>
                        )}

                        {/* Intersect Blast */}
                        {step === 3 && (
                            <motion.div
                                initial={{ scale: 0, opacity: 1 }}
                                animate={{ scale: 2, opacity: 0 }}
                                className="absolute inset-0 rounded-full border-4 border-primary/50"
                            />
                        )}
                    </div>
                </div>

                {/* Caption Section */}
                <div className="mt-6 pt-6 border-t border-border dark:border-white/5 min-h-[60px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-center"
                        >
                            {step === 0 && <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">Initialize logic scan...</p>}
                            {step === 1 && <p className="text-[11px] font-bold text-primary uppercase tracking-widest leading-relaxed">Scanning Row 1: <br />TEAM &laquo; LAKERS</p>}
                            {step === 2 && <p className="text-[11px] font-bold text-secondary uppercase tracking-widest leading-relaxed">Scanning Col 1: <br />ACCOLADE &raquo; MVP</p>}
                            {step === 3 && <p className="text-[11px] font-bold text-foreground dark:text-white uppercase tracking-widest leading-relaxed">Intersection Found! <br />VALIDATING DATA...</p>}
                            {step >= 4 && <p className="text-[11px] font-bold text-primary uppercase tracking-widest leading-relaxed">Match Confirmed: <br />KOBE BRYANT (Lakers & MVP)</p>}
                        </motion.div>
                    </AnimatePresence>
                </div>

            </div>

            {/* Decorative Pulse Circles */}
            <div className="absolute -top-12 -right-12 h-48 w-48 bg-primary/20 blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 h-48 w-48 bg-secondary/10 blur-[80px] pointer-events-none" />
        </div>
    );
}
