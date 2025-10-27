"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface FeaturedToggleButtonProps {
  quizId: string;
  isFeatured: boolean;
}

export function FeaturedToggleButton({ quizId, isFeatured }: FeaturedToggleButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/featured`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !isFeatured }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update featured status");
      }

      toast({
        title: "Success",
        description: `Quiz ${!isFeatured ? "added to" : "removed from"} featured`,
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      title={isFeatured ? "Remove from featured" : "Add to featured"}
    >
      <Star className={`h-4 w-4 ${isFeatured ? "fill-yellow-500 text-yellow-500" : ""}`} />
    </Button>
  );
}
