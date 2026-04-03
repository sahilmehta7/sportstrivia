"use client";

import { Share2 } from "lucide-react";
import { useShareResults } from "@/components/quiz/ShareResults";
import { Button } from "@/components/ui/button";

interface ResultsShareButtonProps {
  quizTitle: string;
  quizSlug: string;
  userName: string;
  score: number; // percentage 0-100
  correctAnswers: number;
  totalQuestions: number;
  totalPoints: number;
  timeSpent: number; // seconds
  className?: string; // Add className
  children?: React.ReactNode; // Add children
}

export function ResultsShareButton(props: ResultsShareButtonProps) {
  const { shareResults, isGenerating } = useShareResults(props);

    return (
    <div className={props.className}>
      <Button
        onClick={shareResults}
        disabled={isGenerating}
        variant="athletic"
        size="default"
        className="w-full"
      >
        <Share2 className="mr-2 h-4 w-4" />
        {isGenerating ? "Generating..." : (props.children || "Share Results")}
      </Button>
    </div>
  );
}
