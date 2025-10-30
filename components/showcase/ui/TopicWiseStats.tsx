"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import type { ShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor, getChipStyles, getDividerStyles } from "@/lib/showcase-theme";
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

	const shown = topics.slice(0, limit);

	return (
		<div
			className={cn(
				"rounded-[22px] p-4 backdrop-blur-xl ring-1",
				theme === "light" ? "ring-white/50" : "ring-white/10",
				"shadow-[0_24px_80px_-40px_rgba(0,0,0,0.45)]",
				getSurfaceStyles(theme, "raised"),
				className
			)}
		>
			<div className="mb-3 flex items-center justify-between gap-3">
				<div className="min-w-0">
					<h3 className={cn("truncate text-base font-bold leading-tight", textPrimary)}>{title}</h3>
					<p className={cn("truncate text-[11px] leading-tight", textSecondary)}>{description}</p>
				</div>
				{viewAllHref && (
					<GlassButton asChild tone={theme === "light" ? "light" : "dark"} size="sm">
						<Link href={viewAllHref}>View all</Link>
					</GlassButton>
				)}
			</div>

			<div className="space-y-3">
				{shown.map((t) => (
					<div
						key={t.id}
						className={cn(
							"group rounded-xl p-3 transition",
							"backdrop-blur-md",
							"border",
							theme === "light" ? "border-white/60 bg-white/60" : "border-white/10 bg-white/8",
							"hover:bg-white/75 dark:hover:bg-white/12"
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
		</div>
	);
}
