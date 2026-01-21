import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "accent" | "white";
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  variant = "primary",
  className
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-[3px]",
    xl: "h-16 w-16 border-4",
  };

  const variantClasses = {
    primary: "border-primary",
    secondary: "border-secondary",
    accent: "border-accent",
    white: "border-white",
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Background ring */}
      <div
        className={cn(
          "rounded-full border-muted/20 absolute",
          sizeClasses[size],
          className
        )}
      />
      {/* Animated spinner */}
      <div
        className={cn(
          "animate-spin rounded-full border-t-transparent",
          sizeClasses[size],
          variantClasses[variant],
          // Add neon glow to primary/secondary/accent
          variant !== "white" && "shadow-neon-cyan shadow-[0_0_10px_rgba(0,0,0,0.1)]",
          className
        )}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}
