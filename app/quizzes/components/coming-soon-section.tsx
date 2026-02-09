
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
        <div className="w-full h-24 bg-muted/5 rounded-xl animate-pulse border border-border/50" />
    );
}
