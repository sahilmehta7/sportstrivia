import type { QuizResultsSectionProps } from "./types";
import { cn } from "@/lib/utils";
import { getTextColor } from "@/lib/showcase-theme";

export function QuizResultsSection({
  theme,
  title,
  description,
  children,
  className,
}: QuizResultsSectionProps) {
  return (
    <section className={cn("rounded-[1.5rem] p-6", className)}>
      <header className="mb-4 space-y-1">
        <h3 className={cn("text-lg font-bold", getTextColor(theme, "primary"))}>{title}</h3>
        {description ? (
          <p className={cn("text-sm", getTextColor(theme, "secondary"))}>{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}


