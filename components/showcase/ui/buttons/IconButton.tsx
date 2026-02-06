"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ButtonSize, ButtonVariant, iconOnlySizeClasses, variantClasses } from "./buttonTheme";
import { ShowcaseSpinner } from "./Spinner";

export interface ShowcaseIconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  ariaLabel: string;
}

export const ShowcaseIconButton = React.forwardRef<HTMLButtonElement, ShowcaseIconButtonProps>(
  ({ className, variant = "ghost", size = "md", isLoading = false, ariaLabel, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        aria-busy={isLoading || undefined}
        aria-disabled={props.disabled || isLoading || undefined}
        disabled={props.disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center",
          iconOnlySizeClasses[size],
          variantClasses[variant],
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
          (props.disabled || isLoading) && "opacity-60 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {isLoading ? <ShowcaseSpinner size={size} /> : children}
      </button>
    );
  }
);

ShowcaseIconButton.displayName = "ShowcaseIconButton";


