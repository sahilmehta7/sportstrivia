import { Button } from "@/components/ui/button";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";

interface FeaturedCardMinimalProps {
    quiz: PublicQuizListItem;
}

export function FeaturedCardMinimal({ quiz }: FeaturedCardMinimalProps) {
    return (
        <div className="w-full max-w-sm mx-auto bg-card rounded-none border-2 border-primary/20 p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] dark:border-white transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
            <div className="space-y-6">
                <div className="space-y-2">
                    <span className="text-xs font-mono uppercase text-muted-foreground tracking-widest">
                        Quiz #{quiz.slug.split("-").pop()?.slice(0, 4) || "001"}
                    </span>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        {quiz.title}
                    </h2>
                </div>

                <div className="w-full h-px bg-border" />

                <div className="flex gap-4">
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase font-mono">Difficulty</p>
                        <p className="font-bold">{quiz.difficulty}</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase font-mono">Time</p>
                        <p className="font-bold">{Math.ceil((quiz.duration || 300) / 60)}:00</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase font-mono">Avg Score</p>
                        <p className="font-bold">{quiz.averageRating ? (quiz.averageRating * 20).toFixed(0) : 0}%</p>
                    </div>
                </div>

                <Button variant="outline" className="w-full rounded-none border-2 border-foreground hover:bg-foreground hover:text-background font-mono uppercase font-bold py-6">
                    Begin Evaluation
                </Button>
            </div>
        </div>
    );
}
