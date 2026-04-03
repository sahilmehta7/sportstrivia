import type { QuizResultsSectionProps } from "./types";
import { cn } from "@/lib/utils";

export function QuizResultsSection({
  theme: _theme,
  title,
  description,
  children,
  className,
}: QuizResultsSectionProps) {
  return (
    <section className={cn("rounded-md border border-border/60 bg-background p-6", className)}>
      <header className="mb-4 space-y-1">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

