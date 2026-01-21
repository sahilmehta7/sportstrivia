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
            label: "Play",
            icon: Gamepad2,
        },
        {
            href: "/topics",
            label: "Explore",
            icon: Compass,
        },
        {
            href: "/leaderboard",
            label: "Rank",
            icon: Trophy,
        },
        {
            href: "/profile/me",
            label: "Me",
            icon: User,
        },
    ];

    const isActive = (href: string) => {
        if (href === "/quizzes" && (pathname === "/" || pathname === "")) return false;
        return pathname.startsWith(href);
    };

    return (
        <nav className="fixed bottom-0 left-0 z-40 w-full px-4 pb-4 lg:hidden pointer-events-none">
            <div className={cn(
                "flex h-16 w-full items-center justify-around rounded-2xl",
                "glass shadow-glass-lg border-primary/20 pointer-events-auto",
                "safe-area-bottom"
            )}>
                {navLinks.map((link) => {
                    const Icon = link.icon;
                    const active = isActive(link.href);

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "relative flex flex-1 flex-col items-center justify-center gap-1 h-full transition-all duration-300",
                                active
                                    ? "text-primary scale-110"
                                    : "text-muted-foreground opacity-60 hover:opacity-100"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_hsl(var(--neon-cyan))]")} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">{link.label}</span>

                            {active && (
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary shadow-neon-cyan" />
                            )}
                        </Link>
                    );
                })}
            </div>
            {/* Added spacer for safe area inset on physical mobile devices */}
            <div className="h-safe-bottom" />
        </nav>
    );
}
