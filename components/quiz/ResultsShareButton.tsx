"use client";

import { Share2 } from "lucide-react";
import { useShareResults } from "@/components/quiz/ShareResults";
import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";

interface ResultsShareButtonProps {
  quizTitle: string;
  userName: string;
  score: number; // percentage 0-100
  correctAnswers: number;
  totalQuestions: number;
  totalPoints: number;
  timeSpent: number; // seconds
}

export function ResultsShareButton(props: ResultsShareButtonProps) {
  const { shareResults, isGenerating } = useShareResults(props);

  return (
    <ShowcaseButton
      onClick={shareResults}
      disabled={isGenerating}
      variant="primary"
      size="md"
      icon={<Share2 className="h-4 w-4" />}
    >
      {isGenerating ? "Generating..." : "Share Results"}
    </ShowcaseButton>
  );
}


