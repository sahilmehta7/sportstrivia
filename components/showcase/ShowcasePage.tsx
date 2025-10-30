"use client";

import type { ReactNode } from "react";
import { useShowcaseTheme } from "./ShowcaseThemeProvider";
import { cn } from "@/lib/utils";
import { getBackgroundVariant, getBlurCircles, getTextColor, type BackgroundVariant } from "@/lib/showcase-theme";
import { ShowcaseBreadcrumbs, type ShowcaseBreadcrumbItem } from "./ui/Breadcrumbs";

interface ShowcasePageProps {
  title: string;
  subtitle?: string;
  badge?: string;
  variant?: BackgroundVariant;
  children: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: ShowcaseBreadcrumbItem[];
}

export function ShowcasePage({ title, subtitle, badge, variant = "default", children, actions, breadcrumbs }: ShowcasePageProps) {
  const { theme } = useShowcaseTheme();
  const blur = getBlurCircles(theme);

  return (
    <div className={cn("relative min-h-screen overflow-hidden px-4 py-12 sm:px-6 lg:py-16", getBackgroundVariant(variant, theme))}>
      <div className="absolute inset-0 -z-10 opacity-70">
        <div className={cn("absolute -left-20 top-24 h-72 w-72 rounded-full blur-[120px]", blur.circle1)} />
        <div className={cn("absolute right-12 top-12 h-64 w-64 rounded-full blur-[100px]", blur.circle2)} />
        <div className={cn("absolute bottom-8 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full blur-[90px]", blur.circle3)} />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        {breadcrumbs && (
          <div className="mb-4">
            <ShowcaseBreadcrumbs items={breadcrumbs} homeLabel="Showcase" />
          </div>
        )}
        
        <header className="flex flex-col gap-4 text-center">
          {badge && (
            <span className={cn("mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs uppercase tracking-[0.35em]", getTextColor(theme, "muted"), theme === "light" ? "border border-slate-200/50 bg-slate-100/80" : "border border-white/20 bg-white/10")}>{badge}</span>
          )}
          <h1 className={cn("text-4xl font-black uppercase tracking-tight sm:text-5xl lg:text-6xl", getTextColor(theme, "primary"))}>{title}</h1>
          {subtitle && <p className={cn("mx-auto max-w-2xl text-sm", getTextColor(theme, "secondary"))}>{subtitle}</p>}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-end">
            {actions}
          </div>
        </header>

        <main className="flex flex-col gap-12">{children}</main>
      </div>
    </div>
  );
}
