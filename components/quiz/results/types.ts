import type { ReactNode } from "react";
import type { ShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import type { LeaderboardEntry } from "@/lib/services/leaderboard.service";

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

export type QuizResultsLeaderboardEntry = LeaderboardEntry;

export interface QuizResultsSummaryProps {
  data: QuizResultsSummaryData;
  theme?: ShowcaseTheme;
  confetti?: boolean;
  children?: ReactNode;
}

export interface QuizResultsLeaderboardProps {
  entries: QuizResultsLeaderboardEntry[];
  theme?: ShowcaseTheme;
  highlightUserId?: string | null;
  showExtraPlayer?: boolean;
}

export interface QuizResultsCardProps {
  theme?: ShowcaseTheme;
  className?: string;
  children: ReactNode;
}

export interface QuizResultsSectionProps {
  theme?: ShowcaseTheme;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}


