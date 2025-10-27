"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface QuickPreviewModalProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  coverImageUrl?: string;
  durationLabel?: string;
  difficultyLabel?: string;
  onPlay?: () => void;
}

export function ShowcaseQuickPreviewModal({ trigger, title, description, coverImageUrl, durationLabel, difficultyLabel, onPlay }: QuickPreviewModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl overflow-hidden rounded-[2.5rem] border-0 bg-slate-950/90 p-0 text-white">
        <div className="relative h-56 w-full">
          {coverImageUrl ? (
            <Image src={coverImageUrl} alt={title} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400/30 to-pink-500/30 text-4xl">🎮</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent" />
        </div>
        <div className="space-y-4 px-8 py-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{title}</DialogTitle>
            {description && <DialogDescription className="text-sm text-white/70">{description}</DialogDescription>}
          </DialogHeader>
          <div className="flex flex-wrap gap-3 text-xs text-white/70">
            {durationLabel && <span className="rounded-full bg-white/10 px-3 py-1 uppercase tracking-[0.3em]">⏱️ {durationLabel}</span>}
            {difficultyLabel && <span className="rounded-full bg-white/10 px-3 py-1 uppercase tracking-[0.3em]">🎯 {difficultyLabel}</span>}
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" className="rounded-full" onClick={() => onPlay?.()}>Bookmark</Button>
            <Button className="rounded-full" onClick={onPlay}>Play Now</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
