"use client";

import { Share2 } from "lucide-react";
import { ShowcaseButton } from "@/components/showcase/ui/buttons/Button";
import { useToast } from "@/hooks/use-toast";

interface ShareQuizButtonProps {
    title: string;
    url: string;
}

export function ShareQuizButton({ title, url }: ShareQuizButtonProps) {
    const { toast } = useToast();

    const handleShare = async () => {
        // Try Web Share API first
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: `Check out this quiz: ${title}`,
                    url,
                });
                return;
            } catch (error) {
                // Ignore AbortError (user cancelled)
                if (error instanceof Error && error.name !== "AbortError") {
                    console.error("Error sharing:", error);
                }
                // If user explicitly cancelled, we probably shouldn't fallback to clipboard
                // But if it failed for other reasons, we might want to? 
                // For now let's assume if it throws (except abort), we try clipboard or just stop.
                // Actually, if share is supported but fails (e.g. permission denied), we can try clipboard.
                // But AbortError specifically means user closed the share sheet.
                if (error instanceof Error && error.name === "AbortError") return;
            }
        }

        // Fallback to clipboard
        try {
            await navigator.clipboard.writeText(url);
            toast({
                title: "Link Copied",
                description: "Quiz link copied to clipboard",
            });
        } catch (err) {
            console.error("Failed to copy:", err);
            toast({
                title: "Error",
                description: "Failed to copy link",
                variant: "destructive",
            });
        }
    };

    return (
        <ShowcaseButton
            variant="glass"
            size="xl"
            className="w-full sm:w-auto"
            onClick={handleShare}
        >
            <Share2 className="mr-3 h-5 w-5" />
            SHARE
        </ShowcaseButton>
    );
}
