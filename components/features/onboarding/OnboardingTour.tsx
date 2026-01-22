"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

interface Step {
    target: string; // CSS selector
    title: string;
    description: string;
    position: "top" | "bottom" | "left" | "right" | "center";
}

const steps: Step[] = [
    {
        target: "body",
        title: "Welcome to Sports Trivia!",
        description: "The arena is waiting. Are you ready to prove your mastery and climb the global ranks?",
        position: "center",
    },
    {
        target: "body",
        title: "Pick Your Arena",
        description: "Which sport do you dominate? Selecting an arena will curate your first missions.",
        position: "center",
    },
    {
        target: "a[href='/quizzes']",
        title: "Daily Missions",
        description: "Fresh challenges drop every 24 hours. Complete them to earn XP and unlock elite badges.",
        position: "top",
    },
    {
        target: "a[href='/leaderboard']",
        title: "Global Standing",
        description: "Every point counts. Outsmart your rivals to claim your spot among the legends.",
        position: "top",
    },
];

export function OnboardingTour() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [selectedSport, setSelectedSport] = useState<string | null>(null);
    const [position, setPosition] = useState<{ top: number | string; left: number | string }>({ top: 0, left: 0 });

    const sports = [
        { name: "Football", icon: "⚽" },
        { name: "Basketball", icon: "🏀" },
        { name: "Cricket", icon: "🏏" },
        { name: "Tennis", icon: "🎾" },
    ];

    useEffect(() => {
        const seen = localStorage.getItem("hasSeenOnboarding");
        if (!seen) {
            setTimeout(() => setIsVisible(true), 1000);
        }
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const updatePosition = () => {
            const step = steps[currentStep];
            const isMobile = window.innerWidth < 768;

            if (isMobile || step.position === "center") {
                setPosition({ top: "50%", left: "50%" });
                return;
            }

            const element = document.querySelector(step.target);
            if (element) {
                const rect = element.getBoundingClientRect();
                const scrollY = window.scrollY;
                const viewportWidth = window.innerWidth;
                const cardWidth = 400;
                const cardHeight = 250;
                const margin = 20;

                let left = rect.left + (rect.width / 2);
                left = Math.max(left, (cardWidth / 2) + margin);
                left = Math.min(left, viewportWidth - (cardWidth / 2) - margin);

                let top = 0;
                if (step.position === "top") {
                    top = rect.top + scrollY - cardHeight + 40;
                    if (rect.top - cardHeight < 60) {
                        top = rect.bottom + scrollY + 20;
                    }
                } else {
                    top = rect.bottom + scrollY + 20;
                }

                setPosition({ top, left });
                element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [currentStep, isVisible]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
            if (selectedSport) {
                window.location.href = `/quizzes?sport=${selectedSport}`;
            }
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem("hasSeenOnboarding", "true");
    };

    const step = steps[currentStep];

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    <motion.div
                        key="tour-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
                    />

                    <motion.div
                        key={`tour-card-${currentStep}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={cn("fixed z-50 w-[300px] md:w-[400px]")}
                        style={{
                            top: position.top,
                            left: position.left,
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        <Card className="shadow-2xl border-primary/20 bg-background text-foreground overflow-hidden">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg text-primary uppercase tracking-tighter">{step.title}</h3>
                                    <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    {step.description}
                                </p>

                                {currentStep === 1 && (
                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        {sports.map((sport) => (
                                            <button
                                                key={sport.name}
                                                onClick={() => setSelectedSport(sport.name)}
                                                className={cn(
                                                    "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                                    selectedSport === sport.name
                                                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                                                        : "border-white/10 bg-white/5 hover:border-white/20"
                                                )}
                                            >
                                                <span className="text-xl">{sport.icon}</span>
                                                <span className="text-xs font-black uppercase tracking-widest">{sport.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-2">
                                    <div className="flex gap-1">
                                        {steps.map((_, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "h-1.5 w-1.5 rounded-full transition-colors",
                                                    i === currentStep ? "bg-primary" : "bg-muted"
                                                )}
                                            />
                                        ))}
                                    </div>

                                    <Button size="sm" onClick={handleNext} className="rounded-full px-6">
                                        {currentStep === steps.length - 1 ? (
                                            <>Enter Arena <Check className="ml-2 h-3 w-3" /></>
                                        ) : (
                                            <>Next <ChevronRight className="ml-2 h-3 w-3" /></>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
