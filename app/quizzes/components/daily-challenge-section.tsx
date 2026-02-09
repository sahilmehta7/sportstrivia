
import { auth } from "@/lib/auth";
import { DailyChallengeHero } from "@/components/home/DailyChallengeHero";
import { getDailyGameData } from "@/app/quizzes/quiz-utils";

export async function DailyChallengeSection() {
    const session = await auth();
    const userId = session?.user?.id;
    const data = await getDailyGameData(userId);

    if (!data) return null;

    return (
        <section>
            <DailyChallengeHero
                gameId={data.gameId}
                gameType={data.gameType}
                displayName={data.displayName}
                gameNumber={data.gameNumber}
                isCompleted={data.isCompleted}
                solved={data.solved}
                guessCount={data.guessCount}
                maxGuesses={data.maxGuesses}
            />
        </section>
    );
}

export function DailyChallengeSkeleton() {
    return (
        <div className="w-full h-[400px] bg-muted/5 rounded-xl animate-pulse border border-border/50" />
    );
}
