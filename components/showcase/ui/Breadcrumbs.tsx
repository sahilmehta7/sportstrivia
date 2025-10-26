"use client";

import Link from "next/link";
import { Slash } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getTextColor, getChipStyles } from "@/lib/showcase-theme";

export interface ShowcaseBreadcrumbItem {
  label: string;
  href?: string;
}

interface ShowcaseBreadcrumbsProps {
  items: ShowcaseBreadcrumbItem[];
  className?: string;
  homeLabel?: string;
}

export function ShowcaseBreadcrumbs({ items, className, homeLabel = "Home" }: ShowcaseBreadcrumbsProps) {
  const { theme } = useShowcaseTheme();
  const trail = items.length ? items : [{ label: homeLabel, href: "/" }];

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]",
        getChipStyles(theme, "ghost"),
        className
      )}
    >
      {[{ label: homeLabel, href: "/" }, ...trail].map((item, index) => {
        const isLast = index === trail.length;
        const content = item.href && !isLast ? (
          <Link
            key={item.label}
            href={item.href}
            className={cn("transition hover:opacity-80", getTextColor(theme, "secondary"))}
          >
            {item.label}
          </Link>
        ) : (
          <span key={item.label} className={getTextColor(theme, isLast ? "secondary" : "muted")}>
            {item.label}
          </span>
        );

        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 && <Slash className="h-4 w-4 opacity-40" />}
            {content}
          </span>
        );
      })}
    </nav>
  );
}
