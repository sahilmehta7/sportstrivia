"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type TopicAuthorityContainerProps = {
  children: ReactNode;
  summary?: string;
  anchorIds?: string[];
  className?: string;
};

export function TopicAuthorityContainer({
  children,
  summary = "Key facts and context",
  anchorIds = ["topic-key-facts", "topic-faq"],
  className,
}: TopicAuthorityContainerProps) {
  const [expanded, setExpanded] = useState(false);
  const watchedAnchors = useMemo(() => new Set(anchorIds), [anchorIds]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncExpanded = () => {
      if (mediaQuery.matches) {
        setExpanded(true);
      } else if (!window.location.hash) {
        setExpanded(false);
      }
    };

    const handleHashNavigation = () => {
      const hash = decodeURIComponent(window.location.hash.replace("#", ""));
      if (!hash || !watchedAnchors.has(hash)) return;
      setExpanded(true);
      requestAnimationFrame(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    };

    syncExpanded();
    handleHashNavigation();
    mediaQuery.addEventListener("change", syncExpanded);
    window.addEventListener("hashchange", handleHashNavigation);

    return () => {
      mediaQuery.removeEventListener("change", syncExpanded);
      window.removeEventListener("hashchange", handleHashNavigation);
    };
  }, [watchedAnchors]);

  return (
    <section className={cn("rounded-2xl border border-border/50 bg-card/80 p-4 shadow-sm", className)} id="topic-authority">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left md:hidden"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-controls="topic-authority-content"
      >
        <span className="text-base font-semibold text-foreground">{summary}</span>
        <ChevronDown
          className={cn("h-5 w-5 text-muted-foreground transition-transform", expanded && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <div
        id="topic-authority-content"
        className={cn("mt-4", expanded ? "block" : "hidden", "md:mt-0 md:block")}
      >
        {children}
      </div>
    </section>
  );
}
