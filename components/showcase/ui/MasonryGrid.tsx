"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ShowcaseMasonryGridProps {
  children: ReactNode;
  className?: string;
}

export function ShowcaseMasonryGrid({ children, className }: ShowcaseMasonryGridProps) {
  return (
    <div className={cn(
      "flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory",
      className
    )}>
      {React.Children.map(children, (child) => (
        <div className="flex-shrink-0 w-[calc(100vw-2rem)] snap-start sm:w-[500px] md:w-[600px]">
          {child}
        </div>
      ))}
    </div>
  );
}
