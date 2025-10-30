"use client";

import { useEffect } from "react";
import {
  Toast,
  ToastDescription,
  ToastClose,
} from "@/components/ui/toast";
import { PointsReward } from "./PointsReward";
import type { PointsCategory, PointsRewardProps } from "./PointsReward.types";

interface PointsRewardToastProps extends Partial<PointsRewardProps> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duration?: number;
}

export function PointsRewardToast({
  points = 0,
  reason = "",
  category = "quiz",
  open,
  onOpenChange,
  duration = 4000,
  ...props
}: PointsRewardToastProps) {
  // Auto-dismiss after duration
  useEffect(() => {
    if (open && duration > 0) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onOpenChange]);

  return (
    <Toast
      open={open}
      onOpenChange={onOpenChange}
      className="pointer-events-auto bg-transparent border-none shadow-none p-0 pr-2"
    >
      <div className="w-full">
        <PointsReward
          points={points}
          reason={reason}
          category={category}
          variant="toast"
          size="sm"
          {...props}
        />
      </div>
      <ToastClose className="relative -mt-8 -mr-6" />
    </Toast>
  );
}

