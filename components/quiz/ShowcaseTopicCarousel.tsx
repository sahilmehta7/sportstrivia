"use client";

import { useRef, useState, type PointerEvent } from "react";
import { ShowcaseTopicCard, type ShowcaseTopicCardVariant } from "./ShowcaseTopicCard";
import { cn } from "@/lib/utils";

export interface ShowcaseTopicItem {
  id: string;
  title: string;
  description?: string | null;
  href: string;
  accentDark?: string;
  accentLight?: string;
  isFavorite?: boolean;
}

interface ShowcaseTopicCarouselProps {
  items: ShowcaseTopicItem[];
  variant?: ShowcaseTopicCardVariant;
  className?: string;
}

export function ShowcaseTopicCarousel({ items, variant = "dark", className }: ShowcaseTopicCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef({ startX: 0, scrollLeft: 0 });

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    dragState.current = {
      startX: event.clientX,
      scrollLeft: containerRef.current.scrollLeft,
    };
    containerRef.current.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const delta = event.clientX - dragState.current.startX;
    containerRef.current.scrollLeft = dragState.current.scrollLeft - delta;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    containerRef.current.releasePointerCapture(event.pointerId);
    setIsDragging(false);
  };

  const containerStyles = cn(
    "flex w-full gap-6 overflow-x-auto scroll-smooth rounded-[2.5rem] border p-6 backdrop-blur-lg",
    variant === "light"
      ? "border-white/40 bg-white/80"
      : "border-white/10 bg-white/10"
  );

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={containerRef}
        className={containerStyles}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {items.map((item) => (
          <ShowcaseTopicCard
            key={item.id}
            href={item.href}
            title={item.title}
            description={item.description}
            accentDark={item.accentDark}
            accentLight={item.accentLight}
            isFavorite={item.isFavorite}
            variant={variant}
            className="min-w-[320px]"
          />
        ))}
        {items.length === 0 && (
          <div className="flex min-h-[240px] w-full items-center justify-center rounded-3xl border border-dashed border-white/20 bg-black/30 text-sm text-white/60">
            No topics available.
          </div>
        )}
      </div>
    </div>
  );
}
