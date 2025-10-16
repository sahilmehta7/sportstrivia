"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Bell, Users, Trophy, User, LogOut, Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export function MainNavigation() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

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

  const navLinks = [
    { href: "/quizzes", label: "Quizzes", icon: Trophy },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/challenges", label: "Challenges", icon: Users },
    { href: "/friends", label: "Friends", icon: Users },
  ];

  const isActive = (href: string) => pathname.startsWith(href);

  if (!session?.user) {
    return (
      <nav className={cn("border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60") }>
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
    <nav className={cn("sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60") }>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold">
          Sports Trivia
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={isActive(link.href) ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <link.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Button>
            </Link>
          ))}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Link href="/notifications">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          </Link>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <UserAvatar
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  size="sm"
                />
                <span className="hidden sm:inline">{session.user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/profile/me" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/friends" className="cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  Friends
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {session.user.role === "ADMIN" && (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
