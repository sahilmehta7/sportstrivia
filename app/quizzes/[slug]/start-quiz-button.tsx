"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface StartQuizButtonProps {
  slug: string;
  disabled?: boolean;
  text?: string;
  attemptId?: string | null;
}

export function StartQuizButton({ slug, disabled, text = "Start Quiz", attemptId }: StartQuizButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (disabled) {
      return;
    }
    
    // If showing "View Results" and we have an attemptId, go to results page
    if (text === "View Results" && attemptId) {
      router.push(`/quizzes/${slug}/results/${attemptId}`);
    } else {
      // Otherwise go to play page
      router.push(`/quizzes/${slug}/play`);
    }
  };

  return (
    <Button size="lg" onClick={handleClick} disabled={disabled}>
      {text}
    </Button>
  );
}
