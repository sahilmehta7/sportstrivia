"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Filter, Play, Shuffle } from "lucide-react";

interface StickyActionsProps {
  onStartQuick?: () => void;
  onRandom?: () => void;
  onOpenFilters?: () => void;
}

export function StickyActions({ onStartQuick, onRandom, onOpenFilters }: StickyActionsProps) {
  const [_visible, _setVisible] = useState(true);
  // Simple always-on bar; can add scroll hide/show later
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 gap-2 border-t bg-background/95 px-4 py-3 shadow-2xl sm:hidden">
      <Button variant="outline" className="gap-2" onClick={onOpenFilters}>
        <Filter className="h-4 w-4" />
        Filters
      </Button>
      <Button className="gap-2" onClick={onStartQuick}>
        <Play className="h-4 w-4" />
        Quick Start
      </Button>
      <Button variant="secondary" className="gap-2" onClick={onRandom}>
        <Shuffle className="h-4 w-4" />
        Random
      </Button>
    </div>
  );
}

