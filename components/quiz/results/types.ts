import type { ReactNode } from "react";
import type { LeaderboardEntry } from "@/lib/services/leaderboard.service";

export type QuizResultsTheme = "light" | "dark";

export interface QuizResultsSummaryData {
  quizTitle: string;
  userName: string;
  userImage?: string | null;
  correctAnswers: number;
  totalQuestions: number;
  totalPoints: number;
  timeSpentSeconds: number;
  passed: boolean;
  longestStreak: number;
  averageResponseTimeSeconds: number;
}

export interface QuizResultsLeaderboardEntry extends LeaderboardEntry {
  topBadge?: {
    name: string;
    imageUrl: string | null;
    rarity: string;
  } | null;
}

export interface QuizResultsSummaryProps {
  data: QuizResultsSummaryData;
  theme?: QuizResultsTheme;
  confetti?: boolean;
  children?: ReactNode;
}

export interface QuizResultsLeaderboardProps {
  entries: QuizResultsLeaderboardEntry[];
  theme?: QuizResultsTheme;
  highlightUserId?: string | null;
  showExtraPlayer?: boolean;
}

export interface QuizResultsCardProps {
  theme?: QuizResultsTheme;
  className?: string;
  children: ReactNode;
}

export interface QuizResultsSectionProps {
  theme?: QuizResultsTheme;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

