"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ShowcaseMasonryGridProps {
  children: ReactNode;
  columns?: number;
  className?: string;
}

export function ShowcaseMasonryGrid({ children, columns = 3, className }: ShowcaseMasonryGridProps) {
  return (
    <div className={cn("grid gap-4", className)} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {children}
    </div>
  );
}
