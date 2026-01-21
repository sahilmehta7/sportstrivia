"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"; // Assuming standard UI components exist
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
        target: "body", // General welcome
        title: "Welcome to Sports Trivia!",
        description: "Ready to prove your sports knowledge? Let's take a quick tour.",
        position: "center",
    },
    {
        target: "a[href='/quizzes']", // Nav link
        title: "Daily Challenges",
        description: "Find new quizzes every day to earn XP and climb the ranks.",
        position: "top",
    },
    {
        target: "a[href='/leaderboard']",
        title: "Global Leaderboard",
        description: "See how you stack up against the best sports fans in the world.",
        position: "top",
    },
    {
        target: "a[href='/profile']", // Profile link
        title: "Your Profile",
        description: "Track your stats, badges, and match history here.",
        position: "top",
    },
];

export function OnboardingTour() {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState<{ top: number | string; left: number | string }>({ top: 0, left: 0 });

    useEffect(() => {
        // Check if user has seen onboarding
        const seen = localStorage.getItem("hasSeenOnboarding");
        if (!seen) {
            // Small delay to allow UI to render
            setTimeout(() => setIsVisible(true), 1000);
        }
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const updatePosition = () => {
            const step = steps[currentStep];
            const isMobile = window.innerWidth < 768;

            // Force center on mobile for better UX
            if (isMobile || step.position === "center") {
                setPosition({ top: "50%", left: "50%" });
                return;
            }

            const element = document.querySelector(step.target);
            if (element) {
                const rect = element.getBoundingClientRect();
                const scrollY = window.scrollY;
                const viewportWidth = window.innerWidth;
                const cardWidth = 350; // Approximated from CSS
                const cardHeight = 200; // Approximated
                const margin = 20;

                let top = 0;
                let left = 0;

                // Horizontal positioning (default centered on target)
                left = rect.left + (rect.width / 2);

                // Clamp horizontal
                // Left edge check: ensure strictly inside left margin
                left = Math.max(left, (cardWidth / 2) + margin);
                // Right edge check: ensure strictly inside right margin
                left = Math.min(left, viewportWidth - (cardWidth / 2) - margin);

                // Vertical positioning
                if (step.position === "top") {
                    top = rect.top + scrollY - cardHeight + 40; // Slight overlap offset

                    // Check top overflow - flip to bottom if needed
                    if (rect.top - cardHeight < 60) { // 60px buffer for navbar
                        top = rect.bottom + scrollY + 20;
                    }
                } else { // Bottom or default
                    top = rect.bottom + scrollY + 20;

                    // Check bottom overflow (if logically possible, though page usually scrolls)
                }

                setPosition({ top, left });

                // Scroll to element with padding
                const scrollOptions: ScrollIntoViewOptions = { behavior: "smooth", block: "center" };
                element.scrollIntoView(scrollOptions);
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
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem("hasSeenOnboarding", "true");
    };

    const step = steps[currentStep];
    const isCenter = step.position === "center";

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
                        className={cn(
                            "fixed z-50 w-[300px] md:w-[350px]",
                        )}
                        style={{
                            top: position.top,
                            left: position.left,
                            transform: "translate(-50%, -50%)", // Always center the card on the calculated top/left coordinates
                        }}
                    >
                        <Card className="shadow-2xl border-primary/20 bg-background text-foreground">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg text-primary">{step.title}</h3>
                                    <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <p className="text-sm text-muted-foreground">
                                    {step.description}
                                </p>

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

                                    <Button size="sm" onClick={handleNext}>
                                        {currentStep === steps.length - 1 ? (
                                            <>Get Started <Check className="ml-2 h-3 w-3" /></>
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
