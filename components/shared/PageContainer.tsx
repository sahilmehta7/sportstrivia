import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  variant?: "default" | "narrow" | "wide" | "full";
  className?: string;
  withPadding?: boolean;
}

const variantStyles = {
  default: "max-w-7xl",
  narrow: "max-w-4xl",
  wide: "max-w-[1440px]",
  full: "max-w-full",
};

export function PageContainer({
  children,
  variant = "default",
  className,
  withPadding = true
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        variantStyles[variant],
        withPadding && "px-4 sm:px-6 lg:px-8",
        // Safe area awareness for mobile-first design
        "safe-area-left safe-area-right",
        className
      )}
    >
      {children}
    </div>
  );
}
