"use client";

import { useMemo, useRef, useState } from "react";
import { ShowcaseTopicCard } from "@/components/quiz/ShowcaseTopicCard";
import { cn } from "@/lib/utils";

interface TopicCarouselItem {
  id: string;
  title: string;
  description?: string | null;
  href: string;
  accentDark?: string;
  accentLight?: string;
  quizCount?: number;
}

interface TopicCarouselProps {
  items: TopicCarouselItem[];
  className?: string;
}

const CARD_WIDTH = 320;
const CARD_GAP = 24;
const SWIPE_THRESHOLD = 60;

export function TopicCarousel({ items, className }: TopicCarouselProps) {
  const [index, setIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const total = items.length;
  const pointerState = useRef({ startX: 0, isDragging: false, pointerId: null as number | null });

  const clampedIndex = useMemo(() => {
    if (index < 0) return 0;
    if (index > Math.max(0, total - 1)) return Math.max(0, total - 1);
    return index;
  }, [index, total]);

  const baseOffset = -(CARD_WIDTH + CARD_GAP) * clampedIndex;
  const offset = baseOffset + dragOffset;

  const handlePointerUp = (deltaX: number) => {
    if (total <= 1) return;

    if (deltaX <= -SWIPE_THRESHOLD && clampedIndex < total - 1) {
      setIndex((prev) => Math.min(prev + 1, total - 1));
    } else if (deltaX >= SWIPE_THRESHOLD && clampedIndex > 0) {
      setIndex((prev) => Math.max(prev - 1, 0));
    }

    setDragOffset(0);
  };

  return (
    <div className={cn("relative w-full max-w-6xl", className)}>
      <div
        className="overflow-hidden touch-pan-y"
        onPointerDown={(event) => {
          if (!event.isPrimary) return;
          pointerState.current.startX = event.clientX;
          pointerState.current.isDragging = true;
          pointerState.current.pointerId = event.pointerId;
          (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!pointerState.current.isDragging) return;
          const deltaX = event.clientX - pointerState.current.startX;
          setDragOffset(deltaX);
        }}
        onPointerUp={(event) => {
          if (!pointerState.current.isDragging) return;
          const pointerId = pointerState.current.pointerId ?? event.pointerId;
          pointerState.current.isDragging = false;
          (event.currentTarget as HTMLElement).releasePointerCapture(pointerId);
          handlePointerUp(event.clientX - pointerState.current.startX);
          pointerState.current.pointerId = null;
        }}
        onPointerCancel={(event) => {
          if (!pointerState.current.isDragging) return;
          const pointerId = pointerState.current.pointerId ?? event.pointerId;
          pointerState.current.isDragging = false;
          (event.currentTarget as HTMLElement).releasePointerCapture(pointerId);
          setDragOffset(0);
          pointerState.current.pointerId = null;
        }}
        onPointerLeave={(event) => {
          if (!pointerState.current.isDragging) return;
          const pointerId = pointerState.current.pointerId ?? event.pointerId;
          pointerState.current.isDragging = false;
          (event.currentTarget as HTMLElement).releasePointerCapture(pointerId);
          setDragOffset(0);
          pointerState.current.pointerId = null;
        }}
      >
        <div
          className={cn(
            "flex transition-transform duration-500 ease-out",
            pointerState.current.isDragging && "!transition-none"
          )}
          style={{ transform: `translateX(${offset}px)` }}
        >
          {items.map((item) => (
            <div key={item.id} className="mr-6 last:mr-0" style={{ width: CARD_WIDTH }}>
              <ShowcaseTopicCard
                href={item.href}
                title={item.title}
                description={item.description}
                accentDark={item.accentDark}
                accentLight={item.accentLight}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
