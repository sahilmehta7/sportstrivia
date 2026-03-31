
import { getComingSoonQuizzes } from "@/lib/services/public-quiz.service";
import { ComingSoonWidget } from "@/components/quizzes/coming-soon-widget";

export async function ComingSoonSection() {
    const quizzes = await getComingSoonQuizzes(6);

    if (quizzes.length === 0) return null;

    return (
        <section>
            <ComingSoonWidget quizzes={quizzes} />
        </section>
    );
}

export function ComingSoonSkeleton() {
    return (
        <section className="space-y-12 block w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 border-b-2 border-foreground/5 pb-8">
                <div className="space-y-4">
                    <div className="h-6 w-32 bg-muted/10 animate-pulse" />
                    <div className="h-10 w-64 sm:w-96 bg-muted/10 animate-pulse" />
                </div>
                <div className="h-12 w-48 bg-muted/10 animate-pulse" />
            </div>
            <div className="grid gap-px bg-foreground/5 border border-foreground/5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-muted/5 p-10 h-[300px] animate-pulse" />
                ))}
            </div>
        </section>
    );
}
