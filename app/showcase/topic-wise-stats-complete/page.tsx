"use client";

import { ShowcasePage, ShowcaseSectionHeader } from "@/showcase/components";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassButton } from "@/components/showcase/ui/GlassButton";
import type { ShowcaseTheme } from "@/components/showcase/ShowcaseThemeProvider";
import { getSurfaceStyles, getTextColor, getDividerStyles, getChipStyles } from "@/lib/showcase-theme";

function StatRow({ theme, topic }: any) {
	const textPrimary = getTextColor("primary");
	const textSecondary = getTextColor("secondary");
	return (
		<div
			className={cn(
				"grid grid-cols-12 items-center gap-3 rounded-xl border p-3 transition",
				"backdrop-blur-md",
				theme === "light" ? "border-white/60 bg-white/60 hover:bg-white/75" : "border-white/10 bg-white/8 hover:bg-white/12"
			)}
		>
			<div className="col-span-5 flex items-center gap-3">
				{topic.icon && (
					<div className={cn("flex h-8 w-8 items-center justify-center rounded-lg text-sm", theme === "light" ? "bg-white/80" : "bg-white/10")}>
						<span className="leading-none">{topic.icon}</span>
					</div>
				)}
				<div>
					<div className={cn("text-[13px] font-semibold leading-tight", textPrimary)}>{topic.label}</div>
					<div className={cn("text-[11px] leading-tight", textSecondary)}>{topic.quizzesTaken} quizzes • {topic.streak ?? 0} streak</div>
				</div>
			</div>
			<div className="col-span-4">
				<div className="flex items-center justify-between text-[10px]">
					<span className={textSecondary}>Accuracy</span>
					<span className={cn("font-semibold", textPrimary)}>{topic.accuracyPercent}%</span>
				</div>
				<div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
					<div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${topic.accuracyPercent}%` }} />
				</div>
			</div>
			<div className="col-span-3 text-right">
				<span className={cn("rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider", getChipStyles("outline"))}>
					{topic.quizzesTaken} played
				</span>
			</div>
		</div>
	);
}

function cn(...cls: (string | undefined | false)[]) { return cls.filter(Boolean).join(" "); }

function SkeletonTable() {
	return (
		<div className="space-y-3">
			{Array.from({ length: 6 }).map((_, i) => (
				<div key={i} className="grid grid-cols-12 items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
					<div className="col-span-5 flex items-center gap-3">
						<div className="h-8 w-8 animate-pulse rounded-lg bg-white/10" />
						<div className="space-y-1">
							<div className="h-3 w-36 animate-pulse rounded bg-white/20" />
							<div className="h-2.5 w-24 animate-pulse rounded bg-white/10" />
						</div>
					</div>
					<div className="col-span-4 space-y-1">
						<div className="flex items-center justify-between text-[10px] text-white/40">
							<span>Accuracy</span>
							<span>—</span>
						</div>
						<div className="h-1 w-full animate-pulse rounded-full bg-white/10" />
					</div>
					<div className="col-span-3 flex justify-end">
						<div className="h-5 w-20 animate-pulse rounded-full bg-white/10" />
					</div>
				</div>
			))}
		</div>
	);
}

type ApiTopicStat = {
	id: string;
	successRate: number;
	questionsAnswered: number;
	questionsCorrect: number;
	topic: { id: string; name: string; slug: string; emoji?: string | null };
};

export default function TopicWiseStatsCompleteShowcasePage() {
	const { theme: nextTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	const [topics, setTopics] = useState<ApiTopicStat[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [unauth, setUnauth] = useState(false);
	useEffect(() => setMounted(true), []);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("/api/users/me/topic-stats", { cache: "no-store" });
				if (res.status === 401) {
					setUnauth(true);
					return;
				}
				if (!res.ok) return;
				const json = await res.json();
				if (json?.success && Array.isArray(json.data?.topics)) {
					setTopics(json.data.topics as ApiTopicStat[]);
				}
			} catch {
				// no-op
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const theme: ShowcaseTheme = mounted ? (nextTheme === "light" ? "light" : "dark") : "dark";

	const textPrimary = getTextColor("primary");
	const divider = getDividerStyles();

	const mapped = (topics ?? []).map((t) => ({
		id: t.id,
		label: t.topic.name,
		accuracyPercent: Math.round(t.successRate),
		quizzesTaken: t.questionsAnswered,
		streak: undefined,
		icon: t.topic.emoji ?? "🏷️",
	}));

	return (
		<ShowcasePage
			title="Complete Topic Wise Stats"
			subtitle="Full-page, glassmorphic breakdown of all your topics"
			badge="SHOWCASE"
			variant="cool"
			breadcrumbs={[{ label: "UI Components", href: "/showcase" }, { label: "Complete Topic Wise Stats" }]}
		>
			{unauth ? (
				<div className={cn("rounded-[24px] p-6 text-center", getSurfaceStyles("raised"))}>
					<p className="mb-4 text-sm">Sign in to view your complete topic-wise stats.</p>
					<GlassButton asChild>
						<Link href="/auth/signin">Sign in</Link>
					</GlassButton>
				</div>
			) : (
				<div className={cn(
					"space-y-5 rounded-[24px] p-5 backdrop-blur-xl ring-1",
					theme === "light" ? "ring-white/50" : "ring-white/10",
					"shadow-[0_24px_80px_-40px_rgba(0,0,0,0.45)]",
					getSurfaceStyles("raised")
				)}>
					<ShowcaseSectionHeader
						eyebrow="Insights"
						title="Your Topic Performance"
						subtitle="Drill down into accuracy, attempts, and streaks"
					/>

					<div className={cn("grid grid-cols-12 items-center gap-3 rounded-xl border p-3 text-[11px] font-medium uppercase tracking-wider", getSurfaceStyles("sunken"))}>
						<div className="col-span-5">Topic</div>
						<div className="col-span-4">Accuracy</div>
						<div className="col-span-3 text-right">Attempts</div>
					</div>

					{loading ? (
						<SkeletonTable />
					) : (
						<div className="space-y-3">
							{mapped.length === 0 ? (
								<div className={cn("rounded-xl p-6 text-sm", getSurfaceStyles("sunken"))}>No topic stats available.</div>
							) : (
								mapped.map((t) => <StatRow key={t.id} theme={theme} topic={t} />)
							)}
						</div>
					)}

					<div className={cn("h-px w-full", divider)} />

					<div className="flex items-center justify-between">
						<p className={cn("text-sm", textPrimary)}>Showing {mapped.length} topics</p>
					</div>
				</div>
			)}
		</ShowcasePage>
	);
}
