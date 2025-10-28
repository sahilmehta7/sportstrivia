"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const glassButtonVariants = cva(
  "inline-flex items-center justify-center gap-3 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-60 hover:-translate-y-0.5 active:translate-y-0 text-center",
  {
    variants: {
      tone: {
        light:
          "border border-slate-200/60 bg-white/70 text-slate-900 shadow-[0_18px_45px_-22px_rgba(15,23,42,0.28)] backdrop-blur-lg hover:bg-white/80 hover:border-slate-300 focus-visible:ring-slate-900/15 focus-visible:ring-offset-0",
        dark:
          "border border-white/25 bg-white/12 text-white/90 shadow-[0_28px_60px_-28px_rgba(15,23,42,0.65)] backdrop-blur-2xl hover:bg-white/18 hover:border-white/40 hover:text-white focus-visible:ring-white/70 focus-visible:ring-offset-0",
      },
      size: {
        sm: "px-4 py-2 text-xs",
        md: "px-6 py-3 text-sm",
        lg: "px-8 py-3.5 text-base",
      },
    },
    defaultVariants: {
      tone: "dark",
      size: "md",
    },
  }
);

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, tone, size, asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : "button";
    return (
      <Component
        className={cn(glassButtonVariants({ tone, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

GlassButton.displayName = "GlassButton";

