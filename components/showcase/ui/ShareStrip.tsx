"use client";

import { Share2, Link as LinkIcon, Twitter, Facebook, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

interface ShowcaseShareStripProps {
  shareUrl?: string;
  message?: string;
  onShare?: (channel: string) => void;
  className?: string;
}

export function ShowcaseShareStrip({ shareUrl, message = "Challenge your friends", onShare, className }: ShowcaseShareStripProps) {
  const { theme } = useShowcaseTheme();

  const handleShare = (channel: string) => {
    onShare?.(channel);
    if (channel === "copy" && shareUrl) {
      void navigator.clipboard?.writeText(shareUrl);
    }
  };

  const actions = [
    { id: "copy", icon: LinkIcon, label: "Copy" },
    { id: "twitter", icon: Twitter, label: "Tweet" },
    { id: "facebook", icon: Facebook, label: "Share" },
    { id: "whatsapp", icon: MessageCircle, label: "DM" },
  ];

  return (
    <div className={cn("flex w-full flex-wrap items-center gap-3 rounded-[2rem] px-5 py-4", getSurfaceStyles(theme, "base"), className)}>
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em]">
        <Share2 className="h-4 w-4" />
        <span className={getTextColor(theme, "secondary")}>{message}</span>
      </div>
      <div className="ml-auto flex flex-wrap gap-2">
        {actions.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant="outline"
            size="sm"
            onClick={() => handleShare(id)}
            className="rounded-full"
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
