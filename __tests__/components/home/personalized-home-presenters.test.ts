import {
  getRailEyebrow,
  getRailReasonLabel,
  getRailTitle,
} from "@/components/home/personalized/personalized-home-presenters";
import type { PersonalizedHomeRail, PersonalizedHomeQuizItem } from "@/types/personalized-home";

function makeRail(kind: PersonalizedHomeRail["kind"], overrides?: Partial<PersonalizedHomeRail>): PersonalizedHomeRail {
  return {
    kind,
    title: kind,
    items: [],
    ...overrides,
  };
}

const baseItem: PersonalizedHomeQuizItem = {
  quizId: "quiz_1",
  slug: "quiz-1",
  title: "Quiz 1",
  coverImageUrl: null,
  difficulty: "MEDIUM",
  estimatedDuration: 300,
  reasonLabel: "Custom reason",
  sourceKind: "INTEREST_PROFILE",
};

describe("personalized-home presenters", () => {
  it("maps eyebrow labels for newly added rail kinds", () => {
    expect(getRailEyebrow(makeRail("RELATED_TO_YOUR_FOLLOWS"))).toBe("Network Adjacent");
    expect(getRailEyebrow(makeRail("MORE_FROM_YOUR_TOP_SPORTS"))).toBe("Sport Focus");
    expect(getRailEyebrow(makeRail("FROM_YOUR_FAVORITE_TEAMS"))).toBe("Team Focus");
    expect(getRailEyebrow(makeRail("FROM_YOUR_FAVORITE_ATHLETES"))).toBe("Athlete Focus");
    expect(getRailEyebrow(makeRail("NEW_IN_YOUR_GRAPH"))).toBe("Fresh Picks");
    expect(getRailEyebrow(makeRail("UNEXPLORED_IN_YOUR_SPORTS"))).toBe("Discover");
  });

  it("keeps trending title + reason normalization behavior", () => {
    const platformRail = makeRail("TRENDING_IN_YOUR_SPORTS", { trendScope: "PLATFORM" });
    const sportRail = makeRail("TRENDING_IN_YOUR_SPORTS", { trendScope: "SPORT_SCOPED" });

    expect(getRailTitle(platformRail)).toBe("Trending Now");
    expect(getRailTitle(sportRail)).toBe("Trending in Your Sports");
    expect(getRailReasonLabel(platformRail, baseItem)).toBe("Trending Now");
    expect(getRailReasonLabel(sportRail, baseItem)).toBe("Custom reason");
  });
});
