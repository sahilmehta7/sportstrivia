import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { QuizzesContent } from "@/app/quizzes/QuizzesContent";
import type { ShowcaseFilterGroup } from "@/components/showcase/ui/FilterBar";

const mockPush = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockUseSearchParams(),
}));

const groups: ShowcaseFilterGroup[] = [
  {
    id: "category",
    label: "Category",
    activeValue: "football",
    options: [
      { value: "all", label: "All Sports" },
      { value: "cricket", label: "Cricket", emoji: "🏏", count: 12 },
      { value: "football", label: "Football", emoji: "⚽", count: 8 },
    ],
  },
];

describe("QuizzesContent sticky rail integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockUseSearchParams.mockReturnValue(new URLSearchParams("page=3&topic=football"));
  });

  it("keeps category filter behavior and updates URL via router push", () => {
    render(
      <QuizzesContent
        quizzes={[]}
        filterGroups={groups}
        difficultyOptions={["EASY", "MEDIUM", "HARD"]}
        pagination={{ page: 1, pages: 1, total: 0, limit: 12 }}
      />
    );

    expect(screen.getByText(/category/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /all sports/i }));
    expect(mockPush).toHaveBeenCalledWith("/quizzes", { scroll: false });
  });

  it("updates difficulty and sort with expected URL mapping", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("page=2&topic=football"));

    render(
      <QuizzesContent
        quizzes={[]}
        filterGroups={groups}
        difficultyOptions={["EASY", "MEDIUM", "HARD"]}
        pagination={{ page: 1, pages: 1, total: 0, limit: 12 }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /hard/i }));
    expect(mockPush).toHaveBeenCalledWith("/quizzes?topic=football&difficulty=HARD", { scroll: false });

    fireEvent.click(screen.getByRole("button", { name: /most played/i }));
    expect(mockPush).toHaveBeenCalledWith("/quizzes?topic=football&sortBy=popularity&sortOrder=desc", { scroll: false });
  });

  it("shows active topic indicator and reset button", () => {
    render(
      <QuizzesContent
        quizzes={[]}
        filterGroups={groups}
        difficultyOptions={["EASY", "MEDIUM", "HARD"]}
        pagination={{ page: 1, pages: 1, total: 0, limit: 12 }}
      />
    );

    expect(screen.getByText(/showing:\s*football/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(mockPush).toHaveBeenCalledWith("/quizzes", { scroll: false });
  });

  it("hydrates topic from localStorage only when URL has no topic/sport", () => {
    localStorage.setItem("quizzes:lastTopicSlug", "cricket");
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));

    render(
      <QuizzesContent
        quizzes={[]}
        filterGroups={groups}
        difficultyOptions={["EASY", "MEDIUM", "HARD"]}
        pagination={{ page: 1, pages: 1, total: 0, limit: 12 }}
      />
    );

    expect(mockPush).toHaveBeenCalledWith("/quizzes?topic=cricket", { scroll: false });
  });

  it("does not hydrate from localStorage when URL already has topic", () => {
    localStorage.setItem("quizzes:lastTopicSlug", "cricket");
    mockUseSearchParams.mockReturnValue(new URLSearchParams("topic=football"));

    render(
      <QuizzesContent
        quizzes={[]}
        filterGroups={groups}
        difficultyOptions={["EASY", "MEDIUM", "HARD"]}
        pagination={{ page: 1, pages: 1, total: 0, limit: 12 }}
      />
    );

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("renders continue playing strip when items are provided", () => {
    render(
      <QuizzesContent
        quizzes={[]}
        filterGroups={groups}
        difficultyOptions={["EASY", "MEDIUM", "HARD"]}
        continuePlayingItems={[
          {
            id: "quiz-1",
            title: "Daily Football Quiz",
            slug: "daily-football-quiz",
            lastPlayedLabel: "Mar 20, 2026",
            streak: 3,
          },
        ]}
        pagination={{ page: 1, pages: 1, total: 0, limit: 12 }}
      />
    );

    expect(screen.getByRole("heading", { name: /continue playing/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /resume daily football quiz/i })).toHaveAttribute(
      "href",
      "/quizzes/daily-football-quiz"
    );
  });

  it("hides continue playing strip when no items are provided", () => {
    render(
      <QuizzesContent
        quizzes={[]}
        filterGroups={groups}
        difficultyOptions={["EASY", "MEDIUM", "HARD"]}
        continuePlayingItems={[]}
        pagination={{ page: 1, pages: 1, total: 0, limit: 12 }}
      />
    );

    expect(screen.queryByRole("heading", { name: /continue playing/i })).not.toBeInTheDocument();
  });
});
