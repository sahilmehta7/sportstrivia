"use client";

import dynamic from "next/dynamic";
import React from "react";

// Lazy load recharts-heavy component with ssr: false
const PerformanceInsights = dynamic(
    () => import("./PerformanceInsights").then((mod) => mod.PerformanceInsights),
    {
        ssr: false,
        loading: () => <div className="h-[300px] w-full animate-pulse rounded-2xl bg-white/5" />,
    }
);

interface PerformanceInsightsWrapperProps {
    userAnswers: Array<{
        id: string;
        isCorrect: boolean;
        timeSpent: number;
        question: {
            questionText: string;
        };
    }>;
    className?: string;
}

export function PerformanceInsightsWrapper(props: PerformanceInsightsWrapperProps) {
    return <PerformanceInsights {...props} />;
}
