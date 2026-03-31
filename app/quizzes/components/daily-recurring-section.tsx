
import { auth } from "@/lib/auth";
import { getDailyRecurringQuizzes } from "@/lib/services/public-quiz.service";
import { ShowcaseDailyCarousel } from "@/components/showcase/ShowcaseDailyCarousel";

export async function DailyRecurringSection() {
    const session = await auth();
    const userId = session?.user?.id;
    const quizzes = await getDailyRecurringQuizzes(userId);

    if (quizzes.length === 0) return null;

    return (
        <section className="space-y-6">
            <div className="flex items-center gap-4 px-1">
                <div className="h-6 w-1 rounded-full bg-primary shadow-neon-cyan" />
                <h2 className="text-2xl font-black tracking-tight uppercase">Daily Quizzes</h2>
            </div>
            <ShowcaseDailyCarousel dailyQuizzes={quizzes} />
        </section>
    );
}

export function DailyRecurringSkeleton() {
    return (
        <section className="space-y-6">
            <div className="flex items-center gap-4 px-1">
                <div className="h-6 w-1 rounded-full bg-primary/20 animate-pulse" />
                <div className="h-8 w-48 bg-muted/10 rounded animate-pulse" />
            </div>
            <div className="flex gap-8 overflow-hidden pb-8 pt-4">
                <div className="shrink-0 w-[320px] aspect-[4/5] bg-muted/5 border-2 border-foreground/5 animate-pulse" />
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="shrink-0 w-[340px] aspect-[4/5] border-2 border-foreground/5 bg-background p-8 animate-pulse flex border-b-2" />
                ))}
            </div>
        </section>
    );
}
