"use client";

import Link from "next/link";
import { Bell, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor } from "@/lib/showcase-theme";

interface ShowcaseTopNavLink {
  label: string;
  href: string;
}

interface ShowcaseTopNavProps {
  links?: ShowcaseTopNavLink[];
  onNotificationsClick?: () => void;
}

const defaultLinks: ShowcaseTopNavLink[] = [
  { label: "Discover", href: "#discover" },
  { label: "Challenges", href: "#challenges" },
  { label: "Creators", href: "#creators" },
  { label: "Live", href: "#live" },
];

export function ShowcaseTopNav({ links = defaultLinks, onNotificationsClick }: ShowcaseTopNavProps) {
  const { theme, toggleTheme } = useShowcaseTheme();
  const [open, setOpen] = useState(false);

  return (
    <header
      className={cn(
        "relative z-30 flex w-full items-center justify-between rounded-full px-6 py-3",
        getSurfaceStyles(theme, "raised")
      )}
    >
      <div className="flex items-center gap-3">
        <Link href="/" className={cn("text-sm font-black uppercase tracking-[0.35em]", getTextColor(theme, "primary"))}>
          Quizverse
        </Link>
        <span className={cn("hidden text-xs uppercase tracking-[0.3em] lg:inline", getTextColor(theme, "muted"))}>
          Showcase
        </span>
      </div>

      <nav className="hidden items-center gap-6 text-sm font-semibold uppercase tracking-[0.25em] lg:flex">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="transition hover:opacity-80">
            <span className={getTextColor(theme, "secondary")}>{link.label}</span>
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="hidden h-9 w-9 rounded-full lg:inline-flex" onClick={onNotificationsClick}>
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="rounded-full uppercase tracking-[0.3em]" onClick={toggleTheme}>
          Switch to {theme === "light" ? "Dark" : "Light"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="ml-1 h-9 w-9 rounded-full lg:hidden"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {open && (
        <div className="absolute left-0 top-full mt-3 w-full rounded-3xl border p-4 shadow-xl lg:hidden"
          data-theme={theme}
        >
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={cn("rounded-2xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.25em]", getSurfaceStyles(theme, "sunken"))}>
                {link.label}
              </Link>
            ))}
            <Button variant="outline" onClick={onNotificationsClick} className="rounded-full">
              Notifications
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
