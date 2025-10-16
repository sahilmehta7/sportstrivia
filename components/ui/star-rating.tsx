"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  maxStars?: number;
  showValue?: boolean;
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
  maxStars = 5,
  showValue = false,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= value;
          const isPartiallyFilled = starValue - 0.5 === value;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(starValue)}
              disabled={readonly}
              className={cn(
                "relative transition-colors",
                !readonly && "cursor-pointer hover:scale-110",
                readonly && "cursor-default"
              )}
              aria-label={`Rate ${starValue} out of ${maxStars} stars`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  isFilled || isPartiallyFilled
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-none text-gray-300"
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="ml-1 text-sm font-medium text-muted-foreground">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

