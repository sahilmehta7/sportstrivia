"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ButtonSize, ButtonVariant, sizeClasses, variantClasses } from "./buttonTheme";
import { ShowcaseSpinner } from "./Spinner";

export interface ShowcaseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  pill?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "start" | "end";
  ariaLabel?: string;
}

export const ShowcaseButton = React.forwardRef<HTMLButtonElement, ShowcaseButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      pill = true,
      icon,
      iconPosition = "start",
      children,
      ariaLabel,
      ...props
    },
    ref
  ) => {
    const isLink = variant === "link";

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        aria-busy={isLoading || undefined}
        aria-disabled={props.disabled || isLoading || undefined}
        disabled={props.disabled || isLoading}
        className={cn(
          // Base
          "inline-flex select-none items-center justify-center font-semibold uppercase tracking-[0.2em]",
          variantClasses[variant],
          !isLink && sizeClasses[size],
          pill ? "rounded-full" : "rounded-xl",
          // Focus ring consistent across variants (link uses text underline only)
          !isLink && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60",
          // Opacity when disabled
          (props.disabled || isLoading) && !isLink && "opacity-60 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {isLoading && (
          <span className={cn("inline-flex items-center", children && "mr-2")}> 
            <ShowcaseSpinner size={size} />
          </span>
        )}

        {icon && iconPosition === "start" && !isLoading && (
          <span className={cn(children && "mr-2", "inline-flex items-center")}>{icon}</span>
        )}

        {children}

        {icon && iconPosition === "end" && !isLoading && (
          <span className={cn(children && "ml-2", "inline-flex items-center")}>{icon}</span>
        )}
      </button>
    );
  }
);

ShowcaseButton.displayName = "ShowcaseButton";


