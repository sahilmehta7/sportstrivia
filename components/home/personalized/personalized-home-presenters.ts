import type {
  PersonalizedHomeRail,
  PersonalizedHomeQuizItem,
  PersonalizedHomeTrendScope,
} from "@/types/personalized-home";

export function getTrendingRailTitle(scope?: PersonalizedHomeTrendScope): string {
  return scope === "PLATFORM" ? "Trending Now" : "Trending in Your Sports";
}

export function getRailTitle(rail: PersonalizedHomeRail): string {
  if (rail.kind !== "TRENDING_IN_YOUR_SPORTS") {
    return rail.title;
  }
  return getTrendingRailTitle(rail.trendScope);
}

export function getRailEyebrow(rail: PersonalizedHomeRail): string {
  switch (rail.kind) {
    case "BECAUSE_YOU_LIKE":
      return "Personalized";
    case "FROM_YOUR_FOLLOWS":
      return "From Your Network";
    case "RELATED_TO_YOUR_FOLLOWS":
      return "Network Adjacent";
    case "MORE_FROM_YOUR_TOP_SPORTS":
      return "Sport Focus";
    case "FROM_YOUR_FAVORITE_TEAMS":
      return "Team Focus";
    case "FROM_YOUR_FAVORITE_ATHLETES":
      return "Athlete Focus";
    case "NEW_IN_YOUR_GRAPH":
      return "Fresh Picks";
    case "UNEXPLORED_IN_YOUR_SPORTS":
      return "Discover";
    case "ONBOARDING_PICKS":
      return "Picked During Onboarding";
    case "TRENDING_IN_YOUR_SPORTS":
      return rail.trendScope === "PLATFORM" ? "Platform Pulse" : "Sports Pulse";
    default:
      return "For You";
  }
}

export function getRailReasonLabel(rail: PersonalizedHomeRail, item: PersonalizedHomeQuizItem): string {
  if (rail.kind === "TRENDING_IN_YOUR_SPORTS" && rail.trendScope === "PLATFORM") {
    return "Trending Now";
  }
  return item.reasonLabel;
}
