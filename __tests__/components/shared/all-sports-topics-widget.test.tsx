import React from "react";
import { render, screen } from "@testing-library/react";
import { AllSportsTopicsWidget } from "@/components/shared/AllSportsTopicsWidget";

describe("AllSportsTopicsWidget", () => {
  it("renders horizontal rail with fixed compact cards and topic links", () => {
    render(
      <AllSportsTopicsWidget
        topics={[
          { id: "t1", name: "Cricket", slug: "cricket", emoji: "🏏", quizCount: 12 },
          { id: "t2", name: "Football", slug: "football", emoji: "⚽", quizCount: 8 },
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: /browse all sports topics/i })).toBeInTheDocument();
    expect(screen.getByText(/pick a sport to jump into its dedicated topic page/i)).toBeInTheDocument();

    const cricketLink = screen.getByRole("link", { name: /cricket/i });
    const footballLink = screen.getByRole("link", { name: /football/i });
    expect(cricketLink).toHaveAttribute("href", "/topics/cricket");
    expect(footballLink).toHaveAttribute("href", "/topics/football");
    expect(cricketLink).toHaveClass("w-[170px]");
    expect(cricketLink).toHaveClass("shrink-0");

    expect(screen.getByText("🏏")).toBeInTheDocument();
    expect(screen.getByText("⚽")).toBeInTheDocument();
    expect(screen.queryByText(/discover/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /go to topics/i })).not.toBeInTheDocument();

    const rail = cricketLink.parentElement;
    expect(rail).toHaveClass("flex");
    expect(rail).toHaveClass("overflow-x-auto");
    expect(rail).toHaveClass("flex-nowrap");
    expect(rail).toHaveClass("no-scrollbar");

    const widget = screen.getByRole("region", { name: /browse all sports topics/i });
    expect(widget).not.toHaveClass("border");
  });

  it("uses fallback emoji when a topic has no emoji", () => {
    render(
      <AllSportsTopicsWidget
        topics={[
          { id: "t1", name: "Olympics", slug: "olympics", emoji: null, quizCount: 3 },
        ]}
      />
    );

    expect(screen.getByText("🏆")).toBeInTheDocument();
  });
});
