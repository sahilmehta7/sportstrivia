"use client";

import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";
import { PointsReward } from "./PointsReward";
import type { PointsCategory, PointsRewardProps, PointsBreakdown } from "./PointsReward.types";

interface PointsRewardModalProps extends Partial<PointsRewardProps> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PointsRewardModal({
  points = 0,
  reason = "",
  category = "quiz",
  breakdown,
  open,
  onOpenChange,
  ...props
}: PointsRewardModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <DialogContent className="max-w-md bg-transparent border-none shadow-none p-0 overflow-visible">
        <DialogTitle className="sr-only">
          Points Reward: {points} points - {reason}
        </DialogTitle>
        <PointsReward
          points={points}
          reason={reason}
          category={category}
          breakdown={breakdown}
          variant="modal"
          size="lg"
          onClose={() => onOpenChange(false)}
          {...props}
        />
      </DialogContent>
    </Dialog>
  );
}

