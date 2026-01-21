"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { NotificationsDropdown } from "@/components/shared/NotificationsDropdown";
import { User, LogOut, Settings, Menu, X, Moon, Sun, Shuffle, Trophy, Gamepad2, Compass } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { GlobalQuizSearch } from "@/components/shared/GlobalQuizSearch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getGlassCard, getTextColor, getGradientText } from "@/lib/showcase-theme";

export function MainNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?unreadOnly=true&limit=1");
      const result = await response.json();
      if (response.ok) {
        setUnreadCount(result.data?.unreadCount || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      void fetchUnreadCount();
    }
  }, [fetchUnreadCount, session?.user]);

  // ARIA live region for notification count updates
  useEffect(() => {
    if (unreadCount > 0) {
      const announcement = document.getElementById('notification-announcement');
      if (announcement) {
        announcement.textContent = `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`;
      }
    }
  }, [unreadCount]);

  const navLinks = [
    { href: "/quizzes", label: "Quizzes", icon: Gamepad2 },
    { href: "/topics", label: "Discover", icon: Compass },
    { href: "/leaderboard", label: "Ranking", icon: Trophy },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  if (!session?.user) {
    return (
      <nav className="sticky top-0 z-50 border-b glass">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className={cn("text-xl font-black tracking-tighter", getGradientText("neon"))}>
            SPORTS TRIVIA
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="neon">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      <div
        id="notification-announcement"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <nav className="sticky top-0 z-50 w-full px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header
            className={cn(
              "flex w-full items-center gap-4 rounded-xl px-4 py-2 sm:px-6 sm:py-3",
              "glass shadow-glass border-primary/10"
            )}
          >
            <div className="flex items-center gap-6">
              <Link href="/" className={cn("text-lg font-black tracking-tight", getGradientText("neon"))}>
                TRIVIA
              </Link>

              {/* Nav Links - Desktop */}
              <nav className="hidden items-center gap-1 lg:flex">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
                      isActive(link.href)
                        ? "bg-primary/10 text-primary shadow-neon-cyan"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <link.icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <GlobalQuizSearch className="flex-1 max-w-xl mx-2" />

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <Link href="/random-quiz" className="hidden sm:block">
                <Button variant="ghost" size="icon-sm" className="rounded-full" title="Random Quiz">
                  <Shuffle className="h-4 w-4" />
                </Button>
              </Link>

              <NotificationsDropdown
                unreadCount={unreadCount}
                onUnreadCountChange={setUnreadCount}
              />

              {/* Mobile Menu Trigger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full lg:hidden"
                    aria-label="Toggle menu"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  id="mobile-menu"
                  className="flex h-full w-full flex-col p-0 glass-elevated border-l-primary/10"
                >
                  <SheetHeader className="border-b border-white/10 px-6 py-6">
                    <SheetTitle className={cn("text-left font-black tracking-tighter text-2xl", getGradientText("neon"))}>
                      MENU
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="mb-8">
                      <GlobalQuizSearch showOnMobile className="w-full" />
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Navigation</p>
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest transition-all",
                            isActive(link.href)
                              ? "bg-primary/10 text-primary border border-primary/20 shadow-neon-cyan"
                              : "hover:bg-muted"
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <link.icon className="h-4 w-4" />
                          {link.label}
                        </Link>
                      ))}

                      <p className="mt-6 px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Account</p>

                      <div className="rounded-2xl bg-muted/30 p-4 mb-2">
                        <div className="flex items-center gap-3 mb-4">
                          <UserAvatar src={session.user.image} alt={session.user.name || "User"} size="sm" />
                          <div>
                            <p className="text-sm font-bold truncate max-w-[150px]">{session.user.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{session.user.email}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Link
                            href="/profile/me"
                            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-white/5 p-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <User className="h-4 w-4" />
                            Profile
                          </Link>
                          <Link
                            href="/challenges"
                            className="flex flex-col items-center justify-center gap-2 rounded-xl bg-white/5 p-3 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Trophy className="h-4 w-4" />
                            Challenges
                          </Link>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setTheme(theme === "dark" ? "light" : "dark");
                          setMobileMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-muted transition-colors"
                      >
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        {theme === "dark" ? "Light Mode" : "Dark Mode"}
                      </button>

                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-destructive/10 text-destructive transition-colors mt-4"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Avatar Dropdown - Desktop */}
              <div className="hidden lg:block">
                <Link href="/profile/me">
                  <UserAvatar
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    size="sm"
                    className="cursor-pointer border border-primary/20 hover:border-primary transition-colors"
                  />
                </Link>
              </div>
            </div>
          </header>
        </div>
      </nav>
    </>
  );
}
