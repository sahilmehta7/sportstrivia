import React from "react";
import { render, screen } from "@testing-library/react";
import { AuthenticatedPersonalizedHome } from "@/components/home/AuthenticatedPersonalizedHome";
import type { PersonalizedHomePayload } from "@/types/personalized-home";

function makePayload(overrides?: Partial<PersonalizedHomePayload>): PersonalizedHomePayload {
  return {
    generatedAt: "2026-04-03T00:00:00.000Z",
    userSummary: {
      userId: "user_1",
      displayName: "Sahil",
      currentStreak: 4,
      longestStreak: 11,
    },
    continuePlaying: [
      {
        id: "attempt_1",
        title: "IPL Captains Through The Years",
        slug: "ipl-captains-through-the-years",
        lastPlayedLabel: "Played yesterday",
        streak: 4,
        daysOfWeek: [true, true, false, true, false, false, true],
      },
    ],
    dailyChallenge: {
      gameId: "daily_1",
      gameType: "WORD",
      displayName: "Cricket Clutch Word",
      gameNumber: 123,
      isCompleted: false,
      maxGuesses: 6,
    },
    rails: [],
    starterCollections: [
      {
        id: "collection_1",
        slug: "new-to-cricket",
        name: "New to Cricket",
        description: "Start with foundational cricket packs.",
        coverImageUrl: null,
      },
    ],
    ...overrides,
  };
}

describe("AuthenticatedPersonalizedHome", () => {
  it("renders platform trending rail with truthful Trending Now semantics", () => {
    const payload = makePayload({
      rails: [
        {
          kind: "TRENDING_IN_YOUR_SPORTS",
          title: "Trending in Your Sports",
          trendScope: "PLATFORM",
          items: [
            {
              quizId: "quiz_1",
              slug: "global-hot-streaks",
              title: "Global Hot Streaks",
              coverImageUrl: null,
              difficulty: "MEDIUM",
              estimatedDuration: 6,
              reasonLabel: "Because you follow IPL",
              sourceKind: "TRENDING_PLATFORM",
            },
          ],
        },
      ],
    });

    render(<AuthenticatedPersonalizedHome payload={payload} variant="treatment" />);

    expect(screen.getByRole("heading", { name: /Trending Now/i })).toBeInTheDocument();
    expect(screen.getAllByText("Trending Now").length).toBeGreaterThanOrEqual(1);
  });

  it("renders sport-scoped trending rail title and item content", () => {
    const payload = makePayload({
      rails: [
        {
          kind: "TRENDING_IN_YOUR_SPORTS",
          title: "Trending in Your Sports",
          trendScope: "SPORT_SCOPED",
          items: [
            {
              quizId: "quiz_2",
              slug: "ipl-powerplay-masters",
              title: "IPL Powerplay Masters",
              coverImageUrl: null,
              difficulty: "HARD",
              estimatedDuration: 8,
              reasonLabel: "Trending in cricket",
              sourceKind: "TRENDING_SPORT",
            },
          ],
        },
      ],
    });

    render(<AuthenticatedPersonalizedHome payload={payload} variant="treatment" />);

    expect(screen.getByRole("heading", { name: /Trending in Your Sports/i })).toBeInTheDocument();
    expect(screen.getAllByText(/IPL Powerplay Masters/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders the core personalized modules and cta surfaces", () => {
    const payload = makePayload({
      rails: [
        {
          kind: "BECAUSE_YOU_LIKE",
          title: "Because You Like Cricket",
          items: [
            {
              quizId: "quiz_3",
              slug: "swing-kings",
              title: "Swing Kings",
              coverImageUrl: null,
              difficulty: "EASY",
              estimatedDuration: 5,
              reasonLabel: "Because you like pace bowling",
              sourceKind: "INTEREST_PROFILE",
            },
          ],
        },
      ],
    });

    render(<AuthenticatedPersonalizedHome payload={payload} variant="treatment" />);

    expect(screen.getByRole("heading", { name: /Welcome back, Sahil/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Continue Playing/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Cricket Clutch Word/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Starter Collections/i })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Swing Kings/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("renders newly added personalized rail kinds", () => {
    const payload = makePayload({
      rails: [
        {
          kind: "RELATED_TO_YOUR_FOLLOWS",
          title: "Related to Your Follows",
          items: [
            {
              quizId: "quiz_10",
              slug: "related-quiz",
              title: "Related Quiz",
              coverImageUrl: null,
              difficulty: "MEDIUM",
              estimatedDuration: 7,
              reasonLabel: "Related to your follows: Mumbai Indians",
              sourceKind: "RELATED_FOLLOWS",
            },
          ],
        },
      ],
      starterCollections: [],
    });

    render(<AuthenticatedPersonalizedHome payload={payload} variant="treatment" />);

    expect(screen.getByRole("heading", { name: /Related to Your Follows/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Network Adjacent/i).length).toBeGreaterThanOrEqual(1);
  });

  it("renders duplicate top-sport rail kinds as separate sections", () => {
    const payload = makePayload({
      rails: [
        {
          kind: "MORE_FROM_YOUR_TOP_SPORTS",
          railId: "MORE_FROM_YOUR_TOP_SPORTS:cricket",
          title: "More From Cricket",
          items: [
            {
              quizId: "quiz_cricket_1",
              slug: "quiz-cricket-1",
              title: "Cricket Quiz",
              coverImageUrl: null,
              difficulty: "MEDIUM",
              estimatedDuration: 6,
              reasonLabel: "More from Cricket",
              sourceKind: "TOP_SPORTS",
            },
          ],
        },
        {
          kind: "MORE_FROM_YOUR_TOP_SPORTS",
          railId: "MORE_FROM_YOUR_TOP_SPORTS:tennis",
          title: "More From Tennis",
          items: [
            {
              quizId: "quiz_tennis_1",
              slug: "quiz-tennis-1",
              title: "Tennis Quiz",
              coverImageUrl: null,
              difficulty: "MEDIUM",
              estimatedDuration: 6,
              reasonLabel: "More from Tennis",
              sourceKind: "TOP_SPORTS",
            },
          ],
        },
      ],
      starterCollections: [],
    });

    render(<AuthenticatedPersonalizedHome payload={payload} variant="treatment" />);

    expect(screen.getByRole("heading", { name: /More From Cricket/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /More From Tennis/i })).toBeInTheDocument();
  });
});
