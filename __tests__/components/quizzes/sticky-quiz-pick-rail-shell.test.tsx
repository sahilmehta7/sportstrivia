import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { StickyQuizPickRailShell } from "@/components/quizzes/sticky-quiz-pick-rail-shell";
import type { ShowcaseFilterOption } from "@/components/showcase/ui/FilterBar";

const mockPush = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockUseSearchParams(),
}));

const options: ShowcaseFilterOption[] = [
  { value: "all", label: "All Sports" },
  { value: "cricket", label: "Cricket", emoji: "🏏", count: 12 },
  { value: "football", label: "Football", emoji: "⚽", count: 8 },
];

describe("StickyQuizPickRailShell", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams("page=3&topic=football"));
  });

  it("updates URL for For You and All chip actions", () => {
    render(
      <StickyQuizPickRailShell
        options={options}
        personalizedTopicSlug="cricket"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /for you/i }));
    expect(mockPush).toHaveBeenCalledWith("/quizzes?topic=cricket", { scroll: false });

    fireEvent.click(screen.getByRole("button", { name: /^all$/i }));
    expect(mockPush).toHaveBeenCalledWith("/quizzes", { scroll: false });
  });
});
