"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface StartQuizButtonProps {
  slug: string;
  disabled?: boolean;
}

export function StartQuizButton({ slug, disabled }: StartQuizButtonProps) {
  const router = useRouter();

  const handleStart = () => {
    if (disabled) {
      return;
    }
    router.push(`/quizzes/${slug}/play`);
  };

  return (
    <Button size="lg" onClick={handleStart} disabled={disabled}>
      Start Quiz
    </Button>
  );
}
