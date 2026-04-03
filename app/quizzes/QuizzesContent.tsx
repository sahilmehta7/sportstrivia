"use client";

import { useRef } from "react";
import { ShowcaseQuizCard } from "@/components/quiz/ShowcaseQuizCard";
import type { PublicQuizListItem } from "@/lib/services/public-quiz.service";
import { getSportGradient } from "@/lib/quiz-formatters";
import { cn } from "@/lib/utils";
import { getGradientText } from "@/lib/showcase-theme";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface QuizzesContentProps {
  quizzes: PublicQuizListItem[];
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalizeSportLabel(sport: string | null | undefined): string {
  const value = sport?.trim();
  if (!value) return "Mixed";
  return value;
}

function buildSportRails(quizzes: PublicQuizListItem[]) {
  const grouped = new Map<string, PublicQuizListItem[]>();

  for (const quiz of quizzes) {
    const key = normalizeSportLabel(quiz.sport);
    const list = grouped.get(key) ?? [];
    list.push(quiz);
    grouped.set(key, list);
  }

  return Array.from(grouped.entries())
    .filter(([, items]) => items.length >= 5)
    .sort((a, b) => {
      if (a[0] === "Mixed") return 1;
      if (b[0] === "Mixed") return -1;
      return a[0].localeCompare(b[0]);
    })
    .map(([sport, items]) => ({ sport, items }));
}

export function QuizzesContent({ quizzes }: QuizzesContentProps) {
  const sportRails = buildSportRails(quizzes);
  const railRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollRail = (sport: string, direction: "left" | "right") => {
    const rail = railRefs.current[sport];
    if (!rail) return;

    const amount = Math.max(rail.clientWidth * 0.85, 320);
    rail.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="space-y-12">
      <div className="flex flex-col gap-8 border-b-2 border-foreground/5 pb-8">
        <div className="space-y-4">
          <h2
            className={cn(
              "text-5xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif]",
              getGradientText("editorial")
            )}
          >
            SPORT RAILS
          </h2>
          <p className="max-w-2xl text-lg text-muted-foreground font-semibold uppercase tracking-tight leading-tight">
            Explore our deepest quiz libraries by sport.
          </p>
        </div>
      </div>

      {sportRails.length > 0 ? (
        <div className="space-y-10">
          {sportRails.map((rail) => (
            <section key={rail.sport} className="space-y-4">
              <div className="flex items-end justify-between gap-4 px-1">
                <h3 className="text-3xl font-bold tracking-tighter uppercase font-['Barlow_Condensed',sans-serif]">
                  {rail.sport}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    {rail.items.length} quiz{rail.items.length === 1 ? "" : "zes"}
                  </span>
                  <div className="hidden items-center gap-1 md:flex">
                    <Button
                      type="button"
                      variant="athletic"
                      size="icon"
                      className="h-9 w-9 rounded-none"
                      onClick={() => scrollRail(rail.sport, "left")}
                      aria-label={`Scroll ${rail.sport} quizzes left`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="athletic"
                      size="icon"
                      className="h-9 w-9 rounded-none"
                      onClick={() => scrollRail(rail.sport, "right")}
                      aria-label={`Scroll ${rail.sport} quizzes right`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div
                ref={(node) => {
                  railRefs.current[rail.sport] = node;
                }}
                className="-mx-4 overflow-x-auto px-4 pb-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
              >
                <div className="flex min-w-max gap-5">
                  {rail.items.map((quiz) => {
                    const gradient = getSportGradient(quiz.sport, hashString(`${quiz.title}`));
                    const durationLabel = quiz.duration ? `${Math.round(quiz.duration / 60)} MIN` : "FLEX";
                    const playersLabel = `${(quiz._count?.attempts || 0).toLocaleString()} PLAYERS`;
                    const difficultyLabel = (quiz.difficulty || "MEDIUM").toString();

                    return (
                      <div key={quiz.id} style={{ scrollSnapAlign: "start" }}>
                        <ShowcaseQuizCard
                          id={quiz.id}
                          title={quiz.title}
                          badgeLabel={quiz.sport || quiz.difficulty || "Quiz"}
                          metaPrimaryLabel="Duration"
                          metaPrimaryValue={durationLabel}
                          metaSecondaryLabel="Players"
                          metaSecondaryValue={playersLabel}
                          metaTertiaryLabel="Difficulty"
                          metaTertiaryValue={difficultyLabel}
                          durationLabel={durationLabel}
                          playersLabel={playersLabel}
                          difficultyLabel={difficultyLabel}
                          accent={gradient}
                          coverImageUrl={quiz.descriptionImageUrl}
                          href={`/quizzes/${quiz.slug}`}
                          className="w-[280px] shrink-0 sm:w-[320px]"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[320px] items-center justify-center border-2 border-dashed border-foreground/10 bg-muted/5 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
            No sport rails yet. New rails appear once a sport reaches five published quizzes.
          </p>
        </div>
      )}
    </section>
  );
}
