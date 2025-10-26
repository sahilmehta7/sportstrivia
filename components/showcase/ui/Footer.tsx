"use client";

import Link from "next/link";
import { Twitter, Facebook, Youtube, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor, getDividerStyles } from "@/lib/showcase-theme";

interface ShowcaseFooterLink {
  label: string;
  href: string;
}

interface ShowcaseFooterColumn {
  heading: string;
  links: ShowcaseFooterLink[];
}

interface ShowcaseFooterProps {
  columns?: ShowcaseFooterColumn[];
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  className?: string;
}

const defaultColumns: ShowcaseFooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Quiz Builder", href: "#builder" },
      { label: "Live Play", href: "#live" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "Leaderboard", href: "#leaderboard" },
      { label: "Clubs", href: "#clubs" },
      { label: "Events", href: "#events" },
      { label: "Hall of Fame", href: "#hall" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#about" },
      { label: "Careers", href: "#careers" },
      { label: "Blog", href: "#blog" },
      { label: "Press", href: "#press" },
    ],
  },
];

export function ShowcaseFooter({
  columns = defaultColumns,
  description = "Built for superfans and athletes. Craft immersive trivia nights, challenge friends, and celebrate every streak.",
  ctaLabel = "Book a demo",
  ctaHref = "#demo",
  className,
}: ShowcaseFooterProps) {
  const { theme } = useShowcaseTheme();

  return (
    <footer
      className={cn(
        "relative overflow-hidden rounded-[2.5rem] px-8 py-12 md:px-12",
        getSurfaceStyles(theme, "raised"),
        className
      )}
    >
      <div className="absolute -top-20 -right-14 h-56 w-56 rounded-full bg-orange-500/30 blur-[160px]" />
      <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-sky-500/20 blur-[160px]" />

      <div className="relative grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500/30 to-pink-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-orange-100">
            <Sparkles className="h-3 w-3" /> Quizverse
          </div>
          <h3 className={cn("text-3xl font-black", getTextColor(theme, "primary"))}>
            Ignite your next trivia night.
          </h3>
          <p className={cn("max-w-md text-sm", getTextColor(theme, "secondary"))}>{description}</p>
          <Link
            href={ctaHref}
            className="inline-flex w-fit items-center justify-center rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-[0_12px_30px_-16px_rgba(249,115,22,0.55)] transition hover:-translate-y-0.5"
          >
            {ctaLabel}
          </Link>

          <div className="flex gap-3 pt-2">
            {[{ icon: Twitter, href: "https://twitter.com" }, { icon: Facebook, href: "https://facebook.com" }, { icon: Youtube, href: "https://youtube.com" }].map(({ icon: Icon, href }) => (
              <Link key={href} href={href} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.heading} className="space-y-4">
              <h4 className={cn("text-sm font-semibold uppercase tracking-[0.3em]", getTextColor(theme, "secondary"))}>
                {column.heading}
              </h4>
              <ul className="space-y-2 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn("transition hover:opacity-80", getTextColor(theme, "muted"))}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className={cn("relative mt-10 h-px", getDividerStyles(theme))} />

      <div className="relative mt-6 flex flex-col gap-3 text-xs text-white/60 md:flex-row md:items-center md:justify-between">
        <p className={cn(getTextColor(theme, "muted"))}>
          © {new Date().getFullYear()} Quizverse Labs. Crafted with fans, for fans.
        </p>
        <div className="flex flex-wrap gap-4">
          <Link href="#privacy" className={cn("transition hover:opacity-80", getTextColor(theme, "muted"))}>
            Privacy
          </Link>
          <Link href="#terms" className={cn("transition hover:opacity-80", getTextColor(theme, "muted"))}>
            Terms
          </Link>
          <Link href="#support" className={cn("transition hover:opacity-80", getTextColor(theme, "muted"))}>
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
