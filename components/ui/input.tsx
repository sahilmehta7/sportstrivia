import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  [
    // Base styles
    "flex w-full rounded-md px-3 py-2",
    "text-base text-foreground",
    "ring-offset-background",
    // Placeholder
    "placeholder:text-muted-foreground",
    // File input
    "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
    // Focus
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    // Disabled
    "disabled:cursor-not-allowed disabled:opacity-50",
    // Transitions
    "transition-colors duration-fast",
    // Mobile text size
    "md:text-sm",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border border-input bg-input",
        glass: "glass border-border focus-visible:border-primary/30",
        ghost: "border-transparent bg-transparent hover:bg-muted",
        neon: "border border-primary/30 bg-input shadow-neon-cyan focus-visible:shadow-[0_0_20px_hsl(var(--neon-cyan)/0.5)]",
      },
      inputSize: {
        default: "h-input",
        sm: "h-input-sm text-sm",
        lg: "h-14 text-base px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size">,
  VariantProps<typeof inputVariants> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
