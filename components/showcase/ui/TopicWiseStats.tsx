"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import type { ShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getTextColor, getChipStyles, getDividerStyles } from "@/lib/showcase-theme";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { glassText } from "@/components/showcase/ui/typography";
import { GlassButton } from "@/components/showcase/ui/GlassButton";

export interface TopicStatItem {
	id: string;
	label: string;
	accuracyPercent: number;
	quizzesTaken: number;
	streak?: number;
	icon?: string; // emoji or small icon string
}

interface TopicWiseStatsProps {
	title?: string;
	description?: string;
	topics: TopicStatItem[];
	limit?: 3 | 5;
	viewAllHref?: string;
	className?: string;
}

export function ShowcaseTopicWiseStats({
	title = "Topic Wise Stats",
	description = "Your performance across favorite topics",
	topics,
	limit = 3,
	viewAllHref = "#",
	className,
}: TopicWiseStatsProps) {
	const { theme: nextTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	const theme: ShowcaseTheme = mounted ? (nextTheme === "light" ? "light" : "dark") : "dark";
	const textPrimary = getTextColor(theme, "primary");
	const textSecondary = getTextColor(theme, "secondary");
	const divider = getDividerStyles(theme);

    // Deduplicate topics by id (or label fallback) before slicing
    const seen = new Set<string>();
    const normalize = (s: string) =>
        (s || "")
            .toString()
            .normalize("NFKD")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();
    const unique = topics.filter((t) => {
        const key = normalize(t.id || t.label);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    const shown = unique.slice(0, limit);

    return (
        <Card className={cn(
            "relative overflow-hidden rounded-[2rem] border shadow-xl bg-card/80 backdrop-blur-lg border-border/60",
            className
        )}>
            {/* Background blur circles to match Profile Info card */}
            <div className="absolute -top-20 -right-14 h-56 w-56 rounded-full bg-orange-500/20 blur-[160px]" />
            <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-blue-500/15 blur-[160px]" />

            <CardHeader className="relative pb-2">
                <CardTitle className={cn("flex items-center gap-2", glassText.h2)}>
                    {title}
                </CardTitle>
                <CardDescription className={cn(glassText.subtitle)}>
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="relative pt-0">
                <div className="space-y-3">
                    {shown.map((t) => (
                        <div
                            key={t.id}
                            className={cn(
                                "group rounded-xl p-3 transition",
                                "backdrop-blur-md border border-border/60",
                                theme === "light" ? "bg-white/60" : "bg-white/10",
                                "hover:bg-white/70 dark:hover:bg-white/15"
                            )}
                        >
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    {t.icon && (
                                        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-sm",
                                            theme === "light" ? "bg-white/80" : "bg-white/10")}
                                        >
                                            <span className="leading-none">{t.icon}</span>
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className={cn("truncate text-[13px] font-semibold leading-tight", textPrimary)}>{t.label}</div>
                                        <div className={cn("truncate text-[11px] leading-tight", textSecondary)}>
                                            {t.quizzesTaken} quizzes • {t.streak ?? 0} streak
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-28">
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className={cn(textSecondary)}>Accuracy</span>
                                            <span className={cn("font-semibold", textPrimary)}>{t.accuracyPercent}%</span>
                                        </div>
                                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/10">
                                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${t.accuracyPercent}%` }} />
                                        </div>
                                    </div>
                                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", getChipStyles(theme, "outline"))}>
                                        {t.quizzesTaken} played
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            

                {topics.length > shown.length && (
                    <div className={cn("mt-3 h-px w-full", divider)} />
                )}
                {topics.length > shown.length && (
                    <div className="mt-2 text-right">
                        <GlassButton asChild tone={theme === "light" ? "light" : "dark"} size="sm">
                            <Link href={viewAllHref}>See all {topics.length} topics</Link>
                        </GlassButton>
                    </div>
                )}
            </CardContent>
        </Card>
	);
}
