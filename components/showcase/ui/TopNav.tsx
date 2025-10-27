"use client";

import Link from "next/link";
import { Bell, Menu, X, User, Moon, Sun, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
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
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setAvatarOpen(false);
      }
    }

    if (avatarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [avatarOpen]);

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
        
        {/* Avatar Dropdown */}
        <div className="relative" ref={avatarRef}>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full hidden lg:flex"
            onClick={() => setAvatarOpen(!avatarOpen)}
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
          </Button>
          
          {avatarOpen && (
            <div className={cn(
              "absolute right-0 top-full mt-2 w-56 rounded-2xl p-2 shadow-xl z-50",
              getSurfaceStyles(theme, "raised")
            )}>
              <div className="flex flex-col gap-1">
                <Link
                  href="/profile"
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                    "hover:bg-white/10"
                  )}
                  onClick={() => setAvatarOpen(false)}
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => {
                    toggleTheme();
                    setAvatarOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                    "hover:bg-white/10"
                  )}
                >
                  {theme === "light" ? (
                    <>
                      <Moon className="h-4 w-4" />
                      <span>Switch to Dark</span>
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4" />
                      <span>Switch to Light</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        
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
