"use client";

import * as React from "react";
import { Instagram, Link2, Sparkles } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

type TeaserCount = 1 | 2;

async function fetchTeaserPng(id: string, count: TeaserCount): Promise<Blob> {
  const seed = Date.now();
  const res = await fetch(
    `/api/admin/quizzes/${encodeURIComponent(id)}/instagram-story?count=${count}&seed=${seed}`,
    { method: "GET" }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Failed to generate teaser (${res.status}): ${text || res.statusText}`);
  }

  return res.blob();
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function shareOrDownloadPng(args: {
  blob: Blob;
  filename: string;
  title: string;
  text: string;
}): Promise<void> {
  const { blob, filename, title, text } = args;

  const file = new File([blob], filename, { type: "image/png" });

  const canShareFiles =
    typeof navigator !== "undefined" &&
    "share" in navigator &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });

  if (canShareFiles) {
    await navigator.share({ title, text, files: [file] });
    return;
  }

  downloadBlob(blob, filename);
}

export function InstagramStoryTeaserMenu(props: {
  id: string;
  slug: string;
  quizTitle: string;
  trigger?: React.ReactNode;
  className?: string;
}) {
  const { id, slug, quizTitle, trigger, className } = props;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const run = async (count: TeaserCount) => {
    setIsLoading(true);
    try {
      const blob = await fetchTeaserPng(id, count);
      const filename = `instagram-story-${slug}-${count}q.png`;
      await shareOrDownloadPng({
        blob,
        filename,
        title: `Quiz Teaser: ${quizTitle}`,
        text: "Share this image to Instagram Story to tease the quiz.",
      });

      toast({
        title: "Teaser Ready",
        description:
          typeof navigator !== "undefined" && "share" in navigator
            ? "Share sheet opened (or downloaded)."
            : "Downloaded teaser image.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed",
        description: error instanceof Error ? error.message : "Could not generate teaser image.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <button
            type="button"
            className={className ?? "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"}
            disabled={isLoading}
          >
            <Instagram className="h-4 w-4" />
            IG Story
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuItem disabled={isLoading} onSelect={() => run(1)}>
          <Sparkles />
          Generate 1-question teaser
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isLoading} onSelect={() => run(2)}>
          <Sparkles />
          Generate 2-question teaser
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={isLoading}
          onSelect={async () => {
            try {
              await navigator.clipboard.writeText(
                `${window.location.origin}/quizzes/${slug}`
              );
              toast({ title: "Copied", description: "Quiz link copied to clipboard." });
            } catch {
              toast({
                title: "Copy failed",
                description: "Could not copy the link.",
                variant: "destructive",
              });
            }
          }}
        >
          <Link2 />
          Copy quiz link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
