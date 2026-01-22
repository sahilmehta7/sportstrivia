"use client";

import { useState, useEffect } from "react";
import { ShowcaseOnboardingTooltipStack } from "@/components/showcase/ui/OnboardingTooltipStack";
import { usePathname } from "next/navigation";

export function OnboardingChecklist() {
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show only on relevant pages for new users
        const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding") === "true";
        const hasCompletedFirstQuiz = localStorage.getItem("hasCompletedFirstQuiz") === "true";

        // We show the checklist if they've seen the tour but haven't finished their journey
        if (hasSeenOnboarding && !hasCompletedFirstQuiz) {
            setIsVisible(true);
        }
    }, [pathname]);

    if (!isVisible) return null;

    const steps = [
        {
            id: "select-arena",
            title: "Pick Your Arena",
            description: "Find a sport category that matches your expertise.",
            icon: "🎯",
        },
        {
            id: "complete-quiz",
            title: "Complete First Mission",
            description: "Finish a quiz to establish your initial rank.",
            icon: "⚡",
        },
        {
            id: "climb-rank",
            title: "View Standing",
            description: "See where you land on the global leaderboard.",
            icon: "🏆",
        },
    ];

    return (
        <div className="fixed bottom-24 right-6 z-40 max-w-sm">
            <ShowcaseOnboardingTooltipStack steps={steps} />
        </div>
    );
}
