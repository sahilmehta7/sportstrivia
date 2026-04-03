import { render, screen } from "@testing-library/react";
import { ShowcaseQuizCard } from "@/components/quiz/ShowcaseQuizCard";

describe("ShowcaseQuizCard", () => {
  it("renders optional context and CTA labels", () => {
    render(
      <ShowcaseQuizCard
        id="quiz-1"
        title="Premier League Trivia"
        badgeLabel="Football"
        metaPrimaryLabel="Duration"
        metaPrimaryValue="10 MIN"
        metaSecondaryLabel="Players"
        metaSecondaryValue="120 Players"
        metaTertiaryLabel="Difficulty"
        metaTertiaryValue="MEDIUM"
        durationLabel="10 MIN"
        playersLabel="120 Players"
        contextLabel="IN PROGRESS"
        ctaLabel="RESUME"
        href="/quizzes/premier-league"
      />
    );

    expect(screen.getByText("IN PROGRESS")).toBeInTheDocument();
    expect(screen.queryByText("RESUME")).not.toBeInTheDocument();
    expect(screen.getByText("Premier League Trivia")).toBeInTheDocument();
    expect(screen.queryByText("Football")).not.toBeInTheDocument();
    expect(screen.getByText("10 MIN")).toBeInTheDocument();
    expect(screen.getByText("120 Players")).toBeInTheDocument();
    expect(screen.getByText("MEDIUM")).toBeInTheDocument();
  });

  it("supports legacy metadata props through compatibility shim", () => {
    render(
      <ShowcaseQuizCard
        id="quiz-legacy"
        title="Legacy Card"
        durationLabel="8 MIN"
        playersLabel="42 Players"
        difficultyLabel="EASY"
      />
    );

    expect(screen.getByText("8 MIN")).toBeInTheDocument();
    expect(screen.getByText("42 Players")).toBeInTheDocument();
    expect(screen.getByText("EASY")).toBeInTheDocument();
  });
});
