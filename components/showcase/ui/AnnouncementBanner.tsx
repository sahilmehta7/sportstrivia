"use client";

import { X, Megaphone } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

interface ShowcaseAnnouncementBannerProps {
  message: string;
  href?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function ShowcaseAnnouncementBanner({ message, href, dismissible = true, onDismiss }: ShowcaseAnnouncementBannerProps) {
  const { theme } = useShowcaseTheme();
  const [open, setOpen] = useState(true);

  if (!open) return null;

  const handleDismiss = () => {
    setOpen(false);
    onDismiss?.();
  };

  const content = (
    <div className="inline-flex items-center gap-2">
      <Megaphone className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between rounded-full px-5 py-3 text-xs font-semibold uppercase tracking-[0.3em]",
        getSurfaceStyles(theme, "raised")
      )}
    >
      {href ? (
        <a href={href} className={cn("flex-1", getTextColor(theme, "secondary"))}>
          {content}
        </a>
      ) : (
        <div className={cn("flex-1", getTextColor(theme, "secondary"))}>{content}</div>
      )}

      {dismissible && (
        <button onClick={handleDismiss} className="ml-3 rounded-full bg-black/10 p-1 text-white hover:bg-black/20">
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
