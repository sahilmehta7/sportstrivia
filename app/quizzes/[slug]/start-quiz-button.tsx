"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface StartQuizButtonProps {
  quizId: string;
  disabled?: boolean;
}

export function StartQuizButton({ quizId, disabled }: StartQuizButtonProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleStart = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/attempts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ quizId }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to start quiz");
        }

        toast({
          title: "Quiz started!",
          description:
            "Your attempt has been created. The play experience will launch soon.",
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to start quiz";
        toast({
          title: "Unable to start quiz",
          description: message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Button size="lg" onClick={handleStart} disabled={disabled || isPending}>
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Start Quiz
    </Button>
  );
}
