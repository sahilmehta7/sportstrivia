import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface QuizResultsLayoutProps {
  className?: string;
  children: ReactNode;
}

export function QuizResultsLayout({ className, children }: QuizResultsLayoutProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col items-center justify-start bg-background px-4 py-8 sm:px-6 sm:py-12 lg:py-16",
        className,
      )}
    >
      <div className="relative w-full max-w-5xl">
        {children}
      </div>
    </div>
  );
}

