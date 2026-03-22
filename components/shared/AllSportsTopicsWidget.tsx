import Link from "next/link";
import { cn } from "@/lib/utils";

interface AllSportsTopicsWidgetProps {
  topics: Array<{
    id: string;
    name: string;
    slug: string;
    emoji?: string | null;
    quizCount?: number;
  }>;
  className?: string;
  title?: string;
  description?: string;
}

export function AllSportsTopicsWidget({
  topics,
  className,
  title = "Browse All Sports Topics",
  description = "Pick a sport to jump into its dedicated topic page.",
}: AllSportsTopicsWidgetProps) {
  if (topics.length === 0) return null;

  return (
    <section
      className={cn(
        "space-y-6 bg-background/95 px-4 py-5 backdrop-blur sm:px-6",
        className
      )}
      aria-label="Browse all sports topics"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground sm:text-2xl">
            {title}
          </h2>
          <p className="max-w-2xl text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:text-[11px]">
            {description}
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-background to-transparent" />
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-nowrap">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/topics/${topic.slug}`}
            className="group w-[170px] shrink-0 border border-foreground/10 bg-background px-3 py-3 transition-colors hover:border-foreground/40"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xl leading-none">{topic.emoji ?? "🏆"}</span>
              {typeof topic.quizCount === "number" ? (
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                  {topic.quizCount}
                </span>
              ) : null}
            </div>
            <p className="mt-2 truncate text-[11px] font-black uppercase tracking-[0.12em] text-foreground group-hover:text-accent">
              {topic.name}
            </p>
          </Link>
        ))}
        </div>
      </div>
    </section>
  );
}
