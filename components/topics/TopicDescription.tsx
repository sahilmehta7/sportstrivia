"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopicDescriptionProps {
  description: string;
  className?: string;
  maxLength?: number;
}

export function TopicDescription({ description, className, maxLength = 160 }: TopicDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!description) return null;

  const shouldTruncate = description.length > maxLength;

  return (
    <div className={cn("relative", className)}>
      <p className="inline m-0 transition-opacity duration-300">
        {shouldTruncate && !isExpanded
          ? `${description.slice(0, maxLength).trim()}...`
          : description}
      </p>
      
      {shouldTruncate && (
        <span className="inline-block whitespace-nowrap align-middle">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1 ml-2 font-bold uppercase tracking-[0.2em] text-[10px] sm:text-[11px] text-foreground bg-foreground/10 hover:bg-foreground/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-sm transition-colors duration-200"
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Show Less" : "Read More"}
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </span>
      )}
    </div>
  );
}
