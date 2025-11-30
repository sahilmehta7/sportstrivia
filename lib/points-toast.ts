"use client";

import { toast } from "@/hooks/use-toast";
import type { PointsCategory, PointsBreakdown } from "@/components/shared/PointsReward.types";

interface ShowPointsRewardOptions {
  points: number;
  reason: string;
  category: PointsCategory;
  breakdown?: PointsBreakdown[];
  duration?: number;
}

/**
 * Show a points reward toast notification
 * 
 * Note: This is a simple implementation. For more control over rendering,
 * use the PointsReward component directly in your toast implementation.
 */
export function showPointsReward({
  points,
  reason,
  category: _category,
  breakdown,
  duration = 4000,
}: ShowPointsRewardOptions) {
  // Format points with breakdown if available
  let description = reason;
  if (breakdown && breakdown.length > 0) {
    const total = breakdown.reduce((sum, b) => sum + b.points, 0);
    description += ` - Total: +${total} points`;
  } else {
    description += ` - +${points} points`;
  }

  toast({
    title: "🎉 Points Earned!",
    description,
    duration,
  });
}

/**
 * Show a points reward for quiz completion
 */
export function showQuizReward(points: number, breakdown?: PointsBreakdown[]) {
  return showPointsReward({
    points,
    reason: "Quiz completed!",
    category: "quiz",
    breakdown,
    duration: 5000,
  });
}

/**
 * Show a points reward for correct answer
 */
export function showAnswerReward(points: number, breakdown?: PointsBreakdown[]) {
  return showPointsReward({
    points,
    reason: "Correct answer!",
    category: "answer",
    breakdown,
    duration: 3000,
  });
}

/**
 * Show a points reward for streak bonus
 */
export function showStreakReward(points: number, streakLength: number) {
  return showPointsReward({
    points,
    reason: `${streakLength}-question streak!`,
    category: "streak",
  });
}

/**
 * Show a points reward for time bonus
 */
export function showTimeBonusReward(points: number, timeSaved: number) {
  return showPointsReward({
    points,
    reason: `Time bonus! Saved ${timeSaved}s`,
    category: "time",
  });
}

/**
 * Show a points reward for badge earned
 */
export function showBadgeReward(badgeName: string) {
  return showPointsReward({
    points: 0,
    reason: `Badge unlocked: ${badgeName}`,
    category: "badge",
    duration: 5000,
  });
}

/**
 * Show a points reward for friend action
 */
export function showFriendReward(points: number, action: string) {
  return showPointsReward({
    points,
    reason: `${action}`,
    category: "friend",
  });
}

/**
 * Show a points reward for challenge
 */
export function showChallengeReward(points: number, outcome: string) {
  return showPointsReward({
    points,
    reason: `Challenge ${outcome}!`,
    category: "challenge",
    duration: 5000,
  });
}

