"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpirationTimerProps {
  expiresAt: Date | string;
  onExpire?: () => void;
}

export function ExpirationTimer({ expiresAt, onExpire }: ExpirationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("Expired");
        if (onExpire) {
          onExpire();
        }
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      // Mark as urgent if < 6 hours remaining
      setIsUrgent(hours < 6);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (isExpired) {
    return (
      <div className="flex items-center gap-1 text-xs text-destructive">
        <Clock className="h-3 w-3" />
        <span>Expired</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs",
        isUrgent
          ? "text-orange-600 dark:text-orange-400 font-medium"
          : "text-muted-foreground"
      )}
    >
      <Clock className="h-3 w-3" />
      <span>Expires in {timeLeft}</span>
    </div>
  );
}

