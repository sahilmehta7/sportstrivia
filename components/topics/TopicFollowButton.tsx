"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { TopicSchemaTypeValue } from "@/lib/topic-schema-options";
import { cn } from "@/lib/utils";

type TopicFollowButtonProps = {
  topicId: string;
  topicName: string;
  schemaType: TopicSchemaTypeValue;
  entityStatus?: string;
  initialIsFollowing: boolean;
  isAuthenticated: boolean;
  layout?: "desktop" | "mobile" | "default";
};

export function TopicFollowButton({
  topicId,
  topicName,
  schemaType,
  entityStatus,
  initialIsFollowing,
  isAuthenticated,
  layout = "default",
}: TopicFollowButtonProps) {
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Topics that are not READY should not be followable in the UI
  if (entityStatus && entityStatus !== "READY") {
    return null;
  }

  const handleToggle = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow topics and track your favorite sports.",
      });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const response = await fetch(`/api/topics/${topicId}/follow`, { method });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update follow status");
      }

      setIsFollowing(!isFollowing);
      toast({
        title: isFollowing ? "Topic unfollowed" : "Topic followed",
        description: isFollowing
          ? `${topicName} was removed from your follows.`
          : `${topicName} was added to your follows.`,
      });
    } catch (error: any) {
      toast({
        title: "Unable to update follows",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const desktopPrimary = "inline-flex items-center justify-center rounded-none bg-foreground px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-background cursor-pointer hover:bg-foreground/90 transition-colors";
  const desktopSecondary = "inline-flex items-center justify-center rounded-none border border-border px-3 py-2 text-xs font-bold uppercase tracking-[0.2em] text-foreground cursor-pointer hover:bg-muted/50 transition-colors bg-transparent";

  const mobilePrimary = "flex w-full min-h-[48px] items-center justify-center rounded-none bg-foreground px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] text-background shadow-md transition-transform active:scale-[0.98] cursor-pointer hover:bg-foreground/90";
  const mobileSecondary = "flex w-full min-h-[48px] items-center justify-center rounded-none border border-border px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] text-foreground bg-background/50 backdrop-blur-sm transition-transform active:scale-[0.98] cursor-pointer hover:bg-muted/50";

  let className = "";
  if (layout === "desktop") {
    className = isFollowing ? desktopSecondary : desktopPrimary;
  } else if (layout === "mobile") {
    className = isFollowing ? mobileSecondary : mobilePrimary;
  } else {
    className = cn(
      "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors",
      isFollowing 
        ? "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
        : "bg-primary text-primary-foreground hover:bg-primary/90"
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isSubmitting}
      aria-label={isFollowing ? `Following ${topicName}` : `Follow ${topicName}`}
      className={cn(className, isSubmitting && "opacity-50 cursor-not-allowed")}
    >
      {isFollowing ? `Following ${topicName}` : `Follow ${topicName}`}
    </button>
  );
}
