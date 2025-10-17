"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AISuggestionModal } from "./ai-suggestion-modal";

interface AISuggestionFabProps {
  topicName: string;
}

export function AISuggestionFab({ topicName }: AISuggestionFabProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AISuggestionModal
        topicName={topicName}
        trigger={
          <Button onClick={() => setOpen(true)} className="gap-2 shadow-lg" size="lg">
            <Sparkles className="h-5 w-5" />
            Need inspiration?
          </Button>
        }
      />
    </div>
  );
}

