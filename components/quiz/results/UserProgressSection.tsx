import { prisma } from "@/lib/db";
import { getTierForPoints } from "@/lib/services/progression.service";
import { Badge } from "@/components/ui/badge";

interface UserProgressSectionProps {
    userId: string;
}

export async function UserProgressSection({ userId }: UserProgressSectionProps) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            totalPoints: true,
            experienceTier: true,
        },
    });

    const totalPoints = user?.totalPoints ?? 0;
    const tierInfo = getTierForPoints(totalPoints);
    const progression = {
        tierLabel: tierInfo.tierLabel,
        totalPoints,
        nextTierLabel: tierInfo.nextTierLabel,
        pointsToNext: tierInfo.pointsToNext,
        progressPercent: tierInfo.progressPercent,
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-white/60">
                        Current tier
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {progression.tierLabel}
                    </p>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                    {progression.tierLabel}
                </Badge>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200/70 dark:bg-white/10">
                <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all"
                    style={{ width: `${progression.progressPercent}%` }}
                />
            </div>
            {progression.pointsToNext !== null ? (
                <p className="text-xs text-slate-500 dark:text-white/60">
                    {progression.pointsToNext.toLocaleString()} points until{" "}
                    {progression.nextTierLabel}
                </p>
            ) : (
                <p className="text-xs text-slate-500 dark:text-white/60">
                    You&apos;ve reached the top tier—legend status!
                </p>
            )}
        </div>
    );
}

export function UserProgressSkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            <div className="flex items-center justify-between gap-3">
                <div className="space-y-2">
                    <div className="h-3 w-24 rounded bg-slate-200 dark:bg-white/10" />
                    <div className="h-6 w-32 rounded bg-slate-200 dark:bg-white/10" />
                </div>
                <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="h-3 w-48 rounded bg-slate-200 dark:bg-white/10" />
        </div>
    )
}
