"use client";

import { useMemo, useRef, useState } from "react";
import { ShowcaseQuizCard } from "./ShowcaseQuizCard";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CarouselItem {
  id: string;
  title: string;
  badgeLabel?: string;
  durationLabel: string;
  playersLabel: string;
  accent: string;
  coverImageUrl?: string | null;
  href?: string;
}

interface ShowcaseQuizCarouselProps {
  items: CarouselItem[];
  className?: string;
}

export function ShowcaseQuizCarousel({ items, className }: ShowcaseQuizCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 360; // Card width + gap
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={cn("group relative w-full", className)}>
      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-8 overflow-x-auto pb-8 pt-4 scrollbar-hide no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
        style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="shrink-0 first:pl-0 last:pr-0"
            style={{ scrollSnapAlign: "start" }}
          >
            <ShowcaseQuizCard
              id={item.id}
              title={item.title}
              badgeLabel={item.badgeLabel}
              durationLabel={item.durationLabel}
              playersLabel={item.playersLabel}
              accent={item.accent}
              coverImageUrl={item.coverImageUrl}
              href={item.href}
            />
          </div>
        ))}
      </div>

      {/* Navigation Arrows (Desktop Only) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 pointer-events-none hidden lg:flex justify-between px-4 z-20">
        <Button
          variant="athletic"
          size="icon"
          className={cn(
            "pointer-events-auto rounded-none shadow-athletic transition-all duration-300",
            showLeftArrow ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
          )}
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          variant="athletic"
          size="icon"
          className={cn(
            "pointer-events-auto rounded-none shadow-athletic transition-all duration-300",
            showRightArrow ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
          )}
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
