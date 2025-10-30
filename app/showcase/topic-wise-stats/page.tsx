"use client";

import { ShowcasePage, ShowcaseSectionHeader, ShowcaseTopicWiseStats } from "@/showcase/components";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GlassButton } from "@/components/showcase/ui/GlassButton";

function SkeletonWidget() {
	return (
		<div className="rounded-[22px] p-4 backdrop-blur-xl ring-1 ring-white/10 bg-white/5">
			<div className="mb-3 flex items-center justify-between">
				<div className="space-y-1">
					<div className="h-4 w-36 animate-pulse rounded bg-white/20" />
					<div className="h-3 w-48 animate-pulse rounded bg-white/10" />
				</div>
				<div className="h-8 w-20 animate-pulse rounded-full bg-white/10" />
			</div>
			<div className="space-y-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
						<div className="flex items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<div className="h-8 w-8 animate-pulse rounded-lg bg-white/10" />
								<div className="space-y-1">
									<div className="h-3 w-28 animate-pulse rounded bg-white/20" />
									<div className="h-2.5 w-24 animate-pulse rounded bg-white/10" />
								</div>
							</div>
							<div className="w-32 space-y-1">
								<div className="flex items-center justify-between text-[10px] text-white/40">
									<span>Accuracy</span>
									<span>—</span>
								</div>
								<div className="h-1 w-full animate-pulse rounded-full bg-white/10" />
							</div>
							<div className="h-5 w-16 animate-pulse rounded-full bg-white/10" />
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

type ApiTopTopic = {
	id: string;
	successRate: number;
	questionsAnswered: number;
	questionsCorrect: number;
	topic: { id: string; name: string; slug: string; emoji?: string | null };
};

export default function TopicWiseStatsShowcasePage() {
	const [topTopics, setTopTopics] = useState<ApiTopTopic[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [unauth, setUnauth] = useState(false);
	useEffect(() => {
		(async () => {
			try {
				const res = await fetch("/api/users/me/stats", { cache: "no-store" });
				if (res.status === 401) {
					setUnauth(true);
					return;
				}
				if (!res.ok) return;
				const json = await res.json();
				if (json?.success && Array.isArray(json.data?.topTopics)) {
					setTopTopics(json.data.topTopics as ApiTopTopic[]);
				}
			} catch {
				// no-op
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const mapToWidget = (items: ApiTopTopic[] | null | undefined) =>
		(items ?? []).map((t) => ({
			id: t.id,
			label: t.topic.name,
			accuracyPercent: Math.round(t.successRate),
			quizzesTaken: t.questionsAnswered,
			streak: undefined,
			icon: t.topic.emoji ?? "🏷️",
		}));

	const topicsFromApi = mapToWidget(topTopics);

	return (
		<ShowcasePage
			title="Topic Wise Stats"
			subtitle="Feature your top topics with glassmorphism in light and dark"
			badge="SHOWCASE"
			variant="cool"
			breadcrumbs={[{ label: "UI Components", href: "/showcase" }, { label: "Topic Wise Stats" }]}
		>
			<div className="space-y-6">
				<ShowcaseSectionHeader
					eyebrow="Overview"
					title="Compact Topic Performance"
					subtitle="Top 3 and Top 5 layouts"
				/>
				{unauth ? (
					<div className="rounded-[22px] p-6 text-center backdrop-blur-xl ring-1 ring-white/10 bg-white/5">
						<p className="mb-4 text-sm">Sign in to see your topic-wise performance.</p>
						<GlassButton asChild>
							<Link href="/auth/signin">Sign in</Link>
						</GlassButton>
					</div>
				) : (
					<div className="grid gap-5 md:grid-cols-2">
						{loading ? (
							<>
								<SkeletonWidget />
								<SkeletonWidget />
							</>
						) : (
							<>
								<ShowcaseTopicWiseStats
									topics={
										topicsFromApi.length > 0
											? topicsFromApi
											: [
												{ id: "t1", label: "Premier League", accuracyPercent: 88, quizzesTaken: 34, streak: 4, icon: "⚽" },
												{ id: "t2", label: "NBA", accuracyPercent: 76, quizzesTaken: 21, streak: 2, icon: "🏀" },
												{ id: "t3", label: "Cricket", accuracyPercent: 69, quizzesTaken: 18, streak: 3, icon: "🏏" },
											]
									}
									limit={3}
									viewAllHref="/showcase/topic-wise-stats-complete"
								/>

								<ShowcaseTopicWiseStats
									title="Top 5 Topics"
									description="Performance snapshot"
									topics={
										topicsFromApi.length > 0
											? topicsFromApi
											: [
												{ id: "t1", label: "Tennis", accuracyPercent: 91, quizzesTaken: 27, icon: "🎾" },
												{ id: "t2", label: "La Liga", accuracyPercent: 79, quizzesTaken: 14, icon: "⚽" },
												{ id: "t3", label: "Olympics", accuracyPercent: 72, quizzesTaken: 10, icon: "🏅" },
												{ id: "t4", label: "Baseball", accuracyPercent: 65, quizzesTaken: 9, icon: "⚾" },
												{ id: "t5", label: "Rugby", accuracyPercent: 58, quizzesTaken: 6, icon: "🏉" },
											]
									}
									limit={5}
									viewAllHref="/showcase/topic-wise-stats-complete"
								/>
							</>
						)}
					</div>
				)}
			</div>
		</ShowcasePage>
	);
}
