"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isFollowableTopicSchemaType } from "@/lib/topic-followability";
import type { TopicSchemaTypeValue } from "@/lib/topic-schema-options";

type TopicFollowButtonProps = {
  topicId: string;
  topicName: string;
  schemaType: TopicSchemaTypeValue;
  entityStatus?: string;
  initialIsFollowing: boolean;
  isAuthenticated: boolean;
};

export function TopicFollowButton({
  topicId,
  topicName,
  schemaType,
  entityStatus,
  initialIsFollowing,
  isAuthenticated,
}: TopicFollowButtonProps) {
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (
    !isAuthenticated ||
    !isFollowableTopicSchemaType(schemaType) ||
    entityStatus !== "READY"
  ) {
    return null;
  }

  const handleToggle = async () => {
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

  return (
    <Button
      type="button"
      variant={isFollowing ? "outline" : "default"}
      onClick={handleToggle}
      disabled={isSubmitting}
      aria-label={isFollowing ? `Following ${topicName}` : `Follow ${topicName}`}
      className="rounded-full"
    >
      {isFollowing ? `Following ${topicName}` : `Follow ${topicName}`}
    </Button>
  );
}
