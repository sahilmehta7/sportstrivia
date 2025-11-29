import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  variant?: "default" | "narrow" | "wide";
  className?: string;
}

const variantStyles = {
  default: "max-w-7xl",
  narrow: "max-w-4xl",
  wide: "max-w-7xl",
};

export function PageContainer({ children, variant = "default", className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        variantStyles[variant],
        "px-4 sm:px-6 lg:px-8",
        className
      )}
    >
      {children}
    </div>
  );
}
