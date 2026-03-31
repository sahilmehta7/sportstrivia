
import { auth } from "@/lib/auth";
import { DailyChallengeHero } from "@/components/home/DailyChallengeHero";
import { getDailyGameData } from "@/app/quizzes/quiz-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export async function DailyChallengeSection() {
    const session = await auth();
    const userId = session?.user?.id;
    const data = await getDailyGameData(userId);

    if (!data) return null;

    return (
        <section>
            <div className="md:hidden rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-sm backdrop-blur">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            {data.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Daily Game</p>
                            <h2 className="text-2xl font-black uppercase tracking-tight">Word of the Day</h2>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                                {data.isCompleted ? "Completed" : "Live now"}
                            </p>
                            <p className="text-sm font-bold uppercase tracking-wide text-foreground">
                                Puzzle #{data.gameNumber.toString().padStart(3, "0")}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Mode</p>
                            <p className="text-sm font-bold uppercase tracking-wide text-foreground">{data.displayName}</p>
                        </div>
                    </div>

                    <Button asChild size="lg" className="h-12 w-full rounded-2xl text-sm font-black uppercase tracking-[0.18em]">
                        <Link href="/daily">
                            {data.isCompleted ? "View today’s result" : "Play word of the day"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>

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
        <section>
            <div className="md:hidden rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-muted/20 animate-pulse" />
                    <div className="space-y-1">
                        <div className="h-3 w-16 bg-muted/20 animate-pulse" />
                        <div className="h-6 w-32 bg-muted/20 animate-pulse" />
                    </div>
                </div>
                <div className="h-16 w-full rounded-2xl bg-muted/10 animate-pulse" />
                <div className="h-12 w-full rounded-2xl bg-muted/10 animate-pulse" />
            </div>

            <div className="hidden md:block border border-border bg-card p-6 sm:p-8">
                <div className="flex justify-between mb-6">
                    <div className="space-y-3">
                        <div className="flex gap-3"><div className="h-4 w-12 bg-muted/20 animate-pulse" /></div>
                        <div className="h-8 w-48 bg-muted/20 animate-pulse" />
                        <div className="h-4 w-64 bg-muted/20 animate-pulse" />
                    </div>
                </div>
                <div className="h-px bg-border mb-6" />
                <div className="h-14 w-full bg-muted/10 animate-pulse" />
            </div>
        </section>
    );
}
