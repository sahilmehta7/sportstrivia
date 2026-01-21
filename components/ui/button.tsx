import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    // Base styles - mobile-first with touch targets
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-md text-sm font-medium",
    "min-h-touch touch-target",
    // Transitions
    "transition-all duration-base ease-smooth",
    // Focus styles
    "ring-offset-background",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    // Disabled styles
    "disabled:pointer-events-none disabled:opacity-50",
    // Icon sizing
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98]",
        outline:
          "border border-border bg-transparent hover:bg-muted hover:border-primary/30 active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.98]",
        ghost:
          "hover:bg-muted text-muted-foreground hover:text-foreground active:scale-[0.98]",
        link:
          "text-primary underline-offset-4 hover:underline",
        // New Neon Arena variants
        glass:
          "glass border-border hover:border-primary/30 text-foreground hover:shadow-glass active:scale-[0.98]",
        neon:
          "bg-primary text-primary-foreground shadow-neon-cyan hover:shadow-[0_0_30px_hsl(var(--neon-cyan)/0.6)] hover:scale-[1.02] active:scale-[0.98]",
        "neon-outline":
          "border border-primary/50 bg-transparent text-primary shadow-neon-cyan hover:bg-primary/10 hover:border-primary active:scale-[0.98]",
        "neon-magenta":
          "bg-secondary text-secondary-foreground shadow-neon-magenta hover:shadow-[0_0_30px_hsl(var(--neon-magenta)/0.6)] hover:scale-[1.02] active:scale-[0.98]",
        "neon-lime":
          "bg-accent text-accent-foreground shadow-neon-lime hover:shadow-[0_0_30px_hsl(var(--neon-lime)/0.6)] hover:scale-[1.02] active:scale-[0.98]",
        success:
          "bg-success text-success-foreground hover:bg-success/90 active:scale-[0.98]",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 min-h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-11 w-11",
        "icon-sm": "h-9 w-9 min-h-9 min-w-9",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" />
            <span className="sr-only">Loading...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
