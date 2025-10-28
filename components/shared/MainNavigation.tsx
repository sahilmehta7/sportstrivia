"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { NotificationsDropdown } from "@/components/shared/NotificationsDropdown";
import { Bell, User, LogOut, Settings, Menu, X, Moon, Sun, Shuffle, Trophy } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export function MainNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [avatarOpen, setAvatarOpen] = useState(false);
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (avatarOpen) {
        const target = event.target as Node;
        const button = document.querySelector('[data-avatar-button]');
        const menu = document.querySelector('[data-avatar-menu]');
        
        if (button && menu && !button.contains(target) && !menu.contains(target)) {
          setAvatarOpen(false);
        }
      }
    }

    if (avatarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [avatarOpen]);

  const navLinks = [
    { href: "/quizzes", label: "Quizzes" },
    { href: "/topics", label: "Discover" },
    { href: "/leaderboard", label: "Leaderboard" },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  if (!session?.user) {
    return (
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Sports Trivia
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        {/* Header with rounded-full styling */}
        <header className={cn(
          "flex w-full items-center justify-between rounded-full px-6 py-3",
          "bg-card border border-border shadow-sm"
        )}>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-black uppercase tracking-[0.35em]">
              Sports Trivia
            </Link>
          </div>

          {/* Nav Links - Desktop */}
          <nav className="hidden items-center gap-6 text-sm font-semibold uppercase tracking-[0.25em] lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition hover:opacity-80",
                  isActive(link.href) && "opacity-100 underline",
                  !isActive(link.href) && "opacity-70"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Random Quiz Button */}
            <Link href="/random-quiz">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                title="Random Quiz"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </Link>

            {/* Notifications */}
            <NotificationsDropdown
              unreadCount={unreadCount}
              onUnreadCountChange={setUnreadCount}
            />

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Avatar Dropdown */}
            <div className="relative hidden lg:block">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={() => setAvatarOpen(!avatarOpen)}
                data-avatar-button
              >
                <UserAvatar
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  size="sm"
                />
              </Button>

              {avatarOpen && (
                <div
                  className={cn(
                    "absolute right-0 top-full mt-2 w-56 rounded-2xl border bg-card p-2 shadow-xl z-50"
                  )}
                  data-avatar-menu
                >
                  <div className="flex flex-col gap-1">
                    {/* User Info */}
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-semibold">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    </div>

                    {/* Menu Items */}
                    <Link
                      href="/profile/me"
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                        "hover:bg-accent"
                      )}
                      onClick={() => setAvatarOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      href="/challenges"
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                        "hover:bg-accent"
                      )}
                      onClick={() => setAvatarOpen(false)}
                    >
                      <Trophy className="h-4 w-4" />
                      <span>Challenges</span>
                    </Link>

                    {session.user.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                          "hover:bg-accent"
                        )}
                        onClick={() => setAvatarOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        <span>Admin Panel</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setTheme(theme === "dark" ? "light" : "dark");
                        setAvatarOpen(false);
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                        "hover:bg-accent"
                      )}
                    >
                      {theme === "dark" ? (
                        <>
                          <Sun className="h-4 w-4" />
                          <span>Switch to Light</span>
                        </>
                      ) : (
                        <>
                          <Moon className="h-4 w-4" />
                          <span>Switch to Dark</span>
                        </>
                      )}
                    </button>

                    <div className="border-t my-1" />

                    <button
                      onClick={() => {
                        setAvatarOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                        "hover:bg-accent text-destructive"
                      )}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute left-0 top-full mt-3 w-full rounded-3xl border bg-card p-4 shadow-xl lg:hidden">
            <div className="flex flex-col gap-3">
              {/* Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.25em] transition",
                    "hover:bg-accent",
                    isActive(link.href) && "bg-accent"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {/* Random Quiz Link */}
              <Link
                href="/random-quiz"
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold uppercase tracking-[0.25em] transition hover:bg-accent"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Shuffle className="h-4 w-4" />
                <span>Random Quiz</span>
              </Link>

              {/* User Section */}
              <div className="border-t pt-3">
                <div className="px-3 py-2 mb-2">
                  <p className="text-sm font-semibold">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground">{session.user.email}</p>
                </div>

                <Link
                  href="/profile/me"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </Link>

                <Link
                  href="/challenges"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Trophy className="h-4 w-4" />
                  <span>Challenges</span>
                </Link>

                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <button
                  onClick={() => {
                    setTheme(theme === "dark" ? "light" : "dark");
                  }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition hover:bg-accent w-full"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4" />
                      <span>Switch to Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4" />
                      <span>Switch to Dark</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition hover:bg-accent text-destructive w-full"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
