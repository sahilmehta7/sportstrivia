import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center rounded-full border",
    "px-2.5 py-0.5 text-xs font-semibold",
    "transition-all duration-fast",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        success:
          "border-transparent bg-success text-success-foreground hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-warning-foreground hover:bg-warning/80",
        outline:
          "border-border text-foreground bg-transparent",
        // Neon Arena variants
        glass:
          "glass border-border text-foreground",
        neon:
          "border-primary/50 bg-primary/10 text-primary shadow-neon-cyan",
        "neon-magenta":
          "border-secondary/50 bg-secondary/10 text-secondary shadow-neon-magenta",
        "neon-lime":
          "border-accent/50 bg-accent/10 text-accent shadow-neon-lime",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {
  pulse?: boolean
}

function Badge({ className, variant, size, pulse = false, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        badgeVariants({ variant, size }),
        pulse && "animate-pulse-glow",
        className
      )}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
