"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Award, X, Sparkles, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export function BadgeCelebration() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [badges, setBadges] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const badgeParam = searchParams.get("badges");
        if (badgeParam) {
            const badgeNames = badgeParam.split(",").filter(Boolean);
            if (badgeNames.length > 0) {
                setBadges(badgeNames);
                setIsOpen(true);
                triggerConfetti();
            }
        }
    }, [searchParams]);

    const triggerConfetti = () => {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ["#10b981", "#3b82f6", "#f59e0b"]
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ["#10b981", "#3b82f6", "#f59e0b"]
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    const handleNext = () => {
        if (currentIndex < badges.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            triggerConfetti();
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        // Remove query param without refreshing
        const params = new URLSearchParams(searchParams.toString());
        params.delete("badges");
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    if (!isOpen || badges.length === 0) return null;

    const currentBadgeName = badges[currentIndex];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: 50 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: 50 }}
                        className="w-full max-w-sm rounded-[2.5rem] bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 p-1 shadow-2xl overflow-hidden"
                    >
                        <div className="relative p-8 flex flex-col items-center text-center space-y-6">
                            {/* Background Effects */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5 text-muted-foreground" />
                            </button>

                            {/* Header */}
                            <div className="space-y-1 relative">
                                <motion.div
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex items-center justify-center gap-2 text-amber-500 font-bold uppercase tracking-widest text-xs"
                                >
                                    <Star className="w-3 h-3 fill-current" />
                                    New Achievement Unlocked
                                    <Star className="w-3 h-3 fill-current" />
                                </motion.div>
                            </div>

                            {/* Badge Icon */}
                            <motion.div
                                key={currentBadgeName}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", damping: 12, stiffness: 100, delay: 0.1 }}
                                className="relative w-32 h-32 flex items-center justify-center"
                            >
                                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 to-purple-500/20 blur-xl animate-pulse" />
                                <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 rotate-6 ring-4 ring-black/20">
                                    <Trophy className="w-12 h-12 text-white drop-shadow-md" />
                                </div>
                            </motion.div>

                            {/* Badge Details */}
                            <div className="space-y-2 relative">
                                <motion.h2
                                    key={currentBadgeName + "title"}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="text-2xl font-black text-white tracking-tight"
                                >
                                    {decodeURIComponent(currentBadgeName)}
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-sm text-slate-400 font-medium"
                                >
                                    You&apos;ve proven your skills on the field.
                                </motion.p>
                            </div>

                            {/* Actions */}
                            <div className="w-full pt-4 space-y-3">
                                <Button
                                    onClick={handleNext}
                                    className="w-full h-12 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200 transition-all text-base shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {currentIndex < badges.length - 1 ? "Next Reward ->" : "Awesome!"}
                                </Button>

                                {currentIndex === badges.length - 1 && (
                                    <button
                                        onClick={() => router.push("/profile/me")}
                                        className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                                    >
                                        View Collection
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
