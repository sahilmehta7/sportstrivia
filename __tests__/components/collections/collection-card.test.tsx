/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { CollectionCard } from "@/components/collections/CollectionCard";

describe("CollectionCard", () => {
  const baseCollection = {
    id: "collection_1",
    name: "Cricket Collection",
    slug: "cricket-collection",
    description: "Curated quiz journey.",
    coverImageUrl: null,
    type: "EDITORIAL",
    quizCount: 5,
  };

  it("links to next quiz when provided", () => {
    render(
      <CollectionCard
        collection={baseCollection}
        nextQuiz={{
          id: "quiz_2",
          slug: "quiz-2",
          title: "Quiz 2",
          order: 2,
        }}
        completedQuizCount={1}
        totalQuizzes={5}
      />
    );

    const link = screen.getByRole("link", { name: /resume #2/i });
    expect(link).toHaveAttribute("href", "/quizzes/quiz-2");
  });

  it("falls back to collection detail link when next quiz is missing", () => {
    render(<CollectionCard collection={baseCollection} />);

    const link = screen.getByRole("link", { name: /view collection/i });
    expect(link).toHaveAttribute("href", "/collections/cricket-collection");
  });
});
