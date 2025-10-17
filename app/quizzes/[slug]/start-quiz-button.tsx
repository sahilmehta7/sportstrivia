"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface StartQuizButtonProps {
  slug: string;
  disabled?: boolean;
  text?: string;
}

export function StartQuizButton({ slug, disabled, text = "Start Quiz" }: StartQuizButtonProps) {
  const router = useRouter();

  const handleStart = () => {
    if (disabled) {
      return;
    }
    router.push(`/quizzes/${slug}/play`);
  };

  return (
    <Button size="lg" onClick={handleStart} disabled={disabled}>
      {text}
    </Button>
  );
}
