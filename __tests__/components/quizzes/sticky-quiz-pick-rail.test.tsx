import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ShowcaseFilterOption } from "@/components/showcase/ui/FilterBar";
import { StickyQuizPickRail } from "@/components/quizzes/sticky-quiz-pick-rail";

const mockUseSearchParams = jest.fn();

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockUseSearchParams(),
}));

function makeOptions(): ShowcaseFilterOption[] {
  return [
    { value: "all", label: "All Sports" },
    { value: "cricket", label: "Cricket", emoji: "🏏", count: 10 },
    { value: "football", label: "Football", emoji: "⚽", count: 8 },
  ];
}

describe("StickyQuizPickRail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));
  });

  it("renders chips in expected order with For You first", () => {
    render(
      <StickyQuizPickRail
        options={makeOptions()}
        personalizedTopicSlug="cricket"
        onSelect={jest.fn()}
      />
    );

    const chips = screen.getAllByRole("button");
    expect(chips[0]).toHaveTextContent("For You");
    expect(chips[1]).toHaveTextContent("All");
    expect(chips[2]).toHaveTextContent("Cricket");
    expect(chips[3]).toHaveTextContent("Football");
  });

  it("reflects active state from URL query", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("topic=football"));

    render(
      <StickyQuizPickRail
        options={makeOptions()}
        personalizedTopicSlug="cricket"
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /football/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /^all$/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("handles all chip selection", () => {
    const onSelect = jest.fn();

    render(
      <StickyQuizPickRail
        options={makeOptions()}
        personalizedTopicSlug="cricket"
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /^all$/i }));

    expect(onSelect).toHaveBeenCalledWith({ type: "all" });
  });

  it("handles topic chip selection", () => {
    const onSelect = jest.fn();

    render(
      <StickyQuizPickRail
        options={makeOptions()}
        personalizedTopicSlug="cricket"
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /football/i }));

    expect(onSelect).toHaveBeenCalledWith({ type: "topic", topicSlug: "football" });
  });

  it("handles For You chip selection", () => {
    const onSelect = jest.fn();

    render(
      <StickyQuizPickRail
        options={makeOptions()}
        personalizedTopicSlug="cricket"
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /for you/i }));

    expect(onSelect).toHaveBeenCalledWith({ type: "for-you", topicSlug: "cricket" });
  });

  it("omits For You when no personalized topic is available", () => {
    render(
      <StickyQuizPickRail
        options={makeOptions()}
        onSelect={jest.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: /for you/i })).not.toBeInTheDocument();
  });
});
