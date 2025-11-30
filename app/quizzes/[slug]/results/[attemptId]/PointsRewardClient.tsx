"use client";

import { useEffect, useState } from "react";
import { PointsReward } from "@/components/shared/PointsReward";
import type { PointsBreakdown } from "@/components/shared/PointsReward.types";

interface PointsRewardClientProps {
  totalPoints: number;
  userId: string;
  attemptId: string;
  searchParams: URLSearchParams;
}

export function PointsRewardClient({
  totalPoints,
  userId: _userId,
  attemptId: _attemptId,
  searchParams,
}: PointsRewardClientProps) {
  const [breakdown, setBreakdown] = useState<PointsBreakdown[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Try to get breakdown from URL params or fetch from API
    const breakdownParam = searchParams.get("breakdown");
    if (breakdownParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(breakdownParam));
        setBreakdown(decoded);
      } catch (e) {
        console.error("Failed to parse breakdown", e);
      }
    }
  }, [searchParams]);

  if (!mounted) {
    return null;
  }

  // Calculate breakdown totals if not provided
  const finalBreakdown: PointsBreakdown[] = breakdown.length > 0 
    ? breakdown 
    : [
        {
          label: "Base Points",
          points: Math.floor(totalPoints * 0.6),
          icon: "💯",
        },
        {
          label: "Accuracy Bonus",
          points: Math.floor(totalPoints * 0.3),
          icon: "🎯",
        },
        {
          label: "Time Bonus",
          points: Math.floor(totalPoints * 0.1),
          icon: "⚡",
        },
      ];

  return (
    <div className="mb-8">
      <PointsReward
        points={totalPoints}
        reason="Quiz completed! Great job!"
        category="quiz"
        variant="inline"
        size="md"
        breakdown={finalBreakdown}
      />
    </div>
  );
}

