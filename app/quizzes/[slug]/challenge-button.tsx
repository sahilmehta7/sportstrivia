"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateChallengeModal } from "@/components/challenges/CreateChallengeModal";
import { Swords } from "lucide-react";

interface ChallengeButtonProps {
  quizId: string;
  disabled?: boolean;
}

export function ChallengeButton({ quizId, disabled }: ChallengeButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        onClick={() => setShowModal(true)}
        disabled={disabled}
      >
        <Swords className="mr-2 h-5 w-5" />
        Challenge a Friend
      </Button>

      <CreateChallengeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => setShowModal(false)}
        preselectedQuizId={quizId}
      />
    </>
  );
}

