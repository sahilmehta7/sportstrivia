"use client";

import dynamic from "next/dynamic";

const BadgeCelebration = dynamic(
    () => import("@/components/quiz/results/BadgeCelebration").then((mod) => mod.BadgeCelebration),
    { ssr: false }
);

export function BadgeCelebrationWrapper() {
    return <BadgeCelebration />;
}
