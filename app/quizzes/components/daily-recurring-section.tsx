
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
                <h2 className="text-2xl font-black tracking-tight uppercase">Daily Arenas</h2>
            </div>
            <ShowcaseDailyCarousel dailyQuizzes={quizzes} />
        </section>
    );
}

export function DailyRecurringSkeleton() {
    return (
        <div className="space-y-6">
            <div className="h-8 w-48 bg-muted/10 rounded animate-pulse" />
            <div className="flex gap-4 overflow-hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-40 w-64 bg-muted/5 rounded-xl animate-pulse flex-shrink-0" />
                ))}
            </div>
        </div>
    );
}
