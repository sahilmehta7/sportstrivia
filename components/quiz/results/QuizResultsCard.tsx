import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getGlassCard } from "@/lib/showcase-theme";
import type { ShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";

interface QuizResultsCardProps {
  theme?: ShowcaseTheme;
  className?: string;
  children: ReactNode;
}

export function QuizResultsCard({ theme, className, children }: QuizResultsCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[1.75rem] border backdrop-blur-xl overflow-hidden",
        getGlassCard(),
        className,
      )}
    >
      {children}
    </div>
  );
}


