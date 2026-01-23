"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";
import Link from "next/link";

export function OnboardingExperience() {
    const [isVisible, setIsVisible] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if user has already dismissed or completed onboarding
        const hasDismissed = localStorage.getItem("hasDismissedOnboarding_v2");
        const hasCompletedFirstQuiz = localStorage.getItem("hasCompletedFirstQuiz") === "true";

        if (!hasDismissed && !hasCompletedFirstQuiz) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        setIsDismissed(true);
        localStorage.setItem("hasDismissedOnboarding_v2", "true");
    };

    return (
        <AnimatePresence>
            {isVisible && !isDismissed && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 right-0 z-[60] p-4 md:p-6 lg:bottom-6 lg:right-6 lg:left-auto lg:w-[400px]"
                >
                    <div className="relative overflow-hidden rounded-[2.5rem] bg-black/80 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 md:p-8">
                        {/* Decorative background glow */}
                        <div className="absolute -top-12 -right-12 h-24 w-24 bg-primary/20 blur-[40px] rounded-full" />
                        <div className="absolute -bottom-12 -left-12 h-24 w-24 bg-accent/20 blur-[40px] rounded-full" />

                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="relative space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                                    <Trophy className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tighter text-white">
                                        Your Arena Awaits
                                    </h3>
                                    <p className="text-xs font-black uppercase tracking-widest text-primary/80">
                                        Level 0 Rookie
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-sm font-medium leading-relaxed text-zinc-400">
                                    Ready to prove your sports IQ? Start your first mission and begin your climb to the global legend status.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <Link href="/quizzes" onClick={handleDismiss} className="w-full">
                                    <ShowcaseButton
                                        variant="primary"
                                        className="w-full group h-14 rounded-2xl"
                                    >
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        START FIRST MISSION
                                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </ShowcaseButton>
                                </Link>
                                <button
                                    onClick={handleDismiss}
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-white transition-colors"
                                >
                                    Maybe later, I&apos;m just looking
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
