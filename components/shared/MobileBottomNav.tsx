"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gamepad2, Compass, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
    const pathname = usePathname();

    const navLinks = [
        {
            href: "/quizzes",
            label: "Quizzes",
            icon: Gamepad2,
        },
        {
            href: "/topics",
            label: "Discover",
            icon: Compass,
        },
        {
            href: "/leaderboard",
            label: "Leaderboard",
            icon: Trophy,
        },
        {
            href: "/profile/me",
            label: "Profile",
            icon: User,
        },
    ];

    const isActive = (href: string) => {
        if (href === "/quizzes" && pathname === "/") return false; // specialized check if needed, but usually exact match or prefix
        return pathname.startsWith(href);
    };

    return (
        <nav className="fixed bottom-0 left-0 z-50 w-full border-t bg-background/80 backdrop-blur-lg lg:hidden pb-safe">
            <div className="flex h-16 items-center justify-around px-2">
                {navLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors",
                                active
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("h-6 w-6", active && "fill-current")} />
                            <span>{link.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
