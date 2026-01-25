"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { NotificationsDropdown } from "@/components/shared/NotificationsDropdown";
import { User, LogOut, Menu, Moon, Sun, Shuffle, Trophy, Gamepad2, Compass, ShieldCheck } from "lucide-react";
import Image from "next/image";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


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

  useEffect(() => {
    if (unreadCount > 0) {
      const announcement = document.getElementById('notification-announcement');
      if (announcement) {
        announcement.textContent = `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`;
      }
    }
  }, [unreadCount]);

  const navLinks = [
    { href: "/quizzes", label: "Playbook", icon: Gamepad2 },
    { href: "/topics", label: "Discover", icon: Compass },
    { href: "/leaderboard", label: "Rankings", icon: Trophy },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  if (!session?.user) {
    return (
      <nav className="sticky top-0 z-50 border-b-2 border-foreground bg-background">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="Sports Trivia Logo"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
            />
            <span className="text-2xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif]">
              SPORTS<span className="text-accent underline decoration-4 underline-offset-4">TRIVIA</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/auth/signin" className="hidden sm:block">
              <span className="text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors">Member Access</span>
            </Link>
            <Link href="/auth/signin">
              <Button variant="accent" size="lg" className="rounded-none font-bold uppercase tracking-widest">
                Join Arena
              </Button>
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
      <nav className="sticky top-0 z-50 border-b-2 border-foreground/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 h-20 flex items-center gap-6 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <Image
              src="/logo.png"
              alt="Sports Trivia Logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif] hidden sm:block">
              SPORTS<span className="text-accent">TRIVIA</span>
            </span>
          </Link>

          {/* Nav Links - Desktop */}
          <nav className="hidden items-center gap-2 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] transition-all",
                  isActive(link.href)
                    ? "text-foreground after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:bg-accent"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <GlobalQuizSearch className="flex-1 max-w-xl mx-2" />

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <Link href="/random-quiz" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="rounded-none hover:bg-muted" title="Random Quiz">
                <Shuffle className="h-5 w-5" />
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
                  size="icon"
                  className="rounded-none lg:hidden border-2 border-foreground/10"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                id="mobile-menu"
                className="flex h-full w-full flex-col p-0 bg-background border-l-2 border-foreground"
              >
                <SheetHeader className="border-b-2 border-foreground px-8 py-8 items-start">
                  <SheetTitle className="text-4xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif]">
                    NAVIGATION <span className="text-accent">SYSTEM</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-8 py-10">
                  <div className="mb-10">
                    <GlobalQuizSearch showOnMobile className="w-full" />
                  </div>

                  <div className="flex flex-col gap-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-2">Primary Channels</p>
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          "flex items-center justify-between border-2 border-foreground/5 bg-muted/30 px-6 py-5 text-xl font-bold uppercase tracking-tighter transition-all font-['Barlow_Condensed',sans-serif]",
                          isActive(link.href)
                            ? "border-accent bg-accent/5 translate-x-2"
                            : "hover:border-foreground/20"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center gap-4">
                          <link.icon className="h-5 w-5 text-muted-foreground" />
                          {link.label}
                        </div>
                        <span className="text-xs text-muted-foreground/40">0{navLinks.indexOf(link) + 1}</span>
                      </Link>
                    ))}

                    <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-2">Personal Hub</p>

                    <div className="border-2 border-foreground p-6 mb-4">
                      <div className="flex items-center gap-4 mb-6">
                        <UserAvatar src={session.user.image} alt={session.user.name || "User"} size="sm" />
                        <div>
                          <p className="text-lg font-bold uppercase tracking-tighter leading-none">{session.user.name}</p>
                          <p className="text-xs font-medium text-muted-foreground">{session.user.email}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {session.user.role === "ADMIN" && (
                          <Link
                            href="/admin"
                            className="flex items-center justify-center gap-3 border-2 border-accent bg-accent/5 p-4 text-[10px] font-bold uppercase tracking-widest hover:bg-accent hover:text-white transition-all text-accent mb-2"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <ShieldCheck className="h-5 w-5" />
                            Command Center
                          </Link>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <Link
                            href="/profile/me"
                            className="flex flex-col items-center justify-center gap-3 border border-foreground/10 p-4 text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <User className="h-5 w-5" />
                            Profile
                          </Link>
                          <Link
                            href="/challenges"
                            className="flex flex-col items-center justify-center gap-3 border border-foreground/10 p-4 text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Trophy className="h-5 w-5" />
                            Rank
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => {
                          setTheme(theme === "dark" ? "light" : "dark");
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-between border border-foreground/5 px-6 py-4 text-xs font-bold uppercase tracking-widest hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                          Visual Theme
                        </div>
                        <span className="text-accent uppercase">{theme}</span>
                      </button>

                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex items-center gap-3 border border-destructive/20 bg-destructive/5 px-6 py-4 text-xs font-bold uppercase tracking-widest text-destructive hover:bg-destructive hover:text-white transition-all mt-6"
                      >
                        <LogOut className="h-4 w-4" />
                        Terminate Session
                      </button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Avatar Dropdown - Desktop */}
            <div className="hidden lg:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center outline-none ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                    <UserAvatar
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      size="sm"
                      className="cursor-pointer border-2 border-foreground/10 hover:border-accent transition-colors rounded-none"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 rounded-none border-2 border-foreground bg-background p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal p-0">
                    <div className="flex flex-col space-y-1 p-5 bg-muted/30">
                      <p className="text-sm font-bold uppercase tracking-tighter leading-none">{session.user.name}</p>
                      <p className="text-[10px] font-medium text-muted-foreground leading-none mt-1">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="m-0 bg-foreground/10 h-0.5" />
                  <div className="p-1">
                    <Link href="/profile/me">
                      <DropdownMenuItem className="rounded-none cursor-pointer focus:bg-accent focus:text-white font-bold uppercase tracking-widest text-[10px] py-4 px-5 transition-colors">
                        <User className="mr-3 h-4 w-4" />
                        <span>Profile Interface</span>
                      </DropdownMenuItem>
                    </Link>

                    {session.user.role === "ADMIN" && (
                      <Link href="/admin">
                        <DropdownMenuItem className="rounded-none cursor-pointer focus:bg-accent focus:text-white font-bold uppercase tracking-widest text-[10px] py-4 px-5 transition-colors">
                          <ShieldCheck className="mr-3 h-4 w-4 text-accent" />
                          <span>Command Center</span>
                        </DropdownMenuItem>
                      </Link>
                    )}

                    <Link href="/challenges">
                      <DropdownMenuItem className="rounded-none cursor-pointer focus:bg-accent focus:text-white font-bold uppercase tracking-widest text-[10px] py-4 px-5 transition-colors">
                        <Trophy className="mr-3 h-4 w-4" />
                        <span>Rankings & Awards</span>
                      </DropdownMenuItem>
                    </Link>
                  </div>
                  <DropdownMenuSeparator className="m-0 bg-foreground/10 h-0.5" />
                  <div className="p-1">
                    <DropdownMenuItem
                      className="rounded-none cursor-pointer focus:bg-destructive focus:text-white text-destructive font-bold uppercase tracking-widest text-[10px] py-4 px-5 transition-colors"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      <span>Terminate Session</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
