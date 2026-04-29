export type PersonalizedHomeVariant = "control" | "treatment";

export type PersonalizedHomeRailKind =
  | "BECAUSE_YOU_LIKE"
  | "FROM_YOUR_FOLLOWS"
  | "RELATED_TO_YOUR_FOLLOWS"
  | "MORE_FROM_YOUR_TOP_SPORTS"
  | "FROM_YOUR_FAVORITE_TEAMS"
  | "FROM_YOUR_FAVORITE_ATHLETES"
  | "NEW_IN_YOUR_GRAPH"
  | "UNEXPLORED_IN_YOUR_SPORTS"
  | "ONBOARDING_PICKS"
  | "TRENDING_IN_YOUR_SPORTS";

export type PersonalizedHomeRailSourceKind =
  | "INTEREST_PROFILE"
  | "FOLLOWS"
  | "RELATED_FOLLOWS"
  | "TOP_SPORTS"
  | "FAVORITE_TEAMS"
  | "FAVORITE_ATHLETES"
  | "NEW_IN_GRAPH"
  | "UNEXPLORED_SPORTS"
  | "ONBOARDING_PICKS"
  | "TRENDING_SPORT"
  | "TRENDING_PLATFORM";

export type PersonalizedHomeTrendScope = "SPORT_SCOPED" | "PLATFORM";

export interface PersonalizedHomeQuizItem {
  quizId: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  difficulty: string;
  estimatedDuration: number | null;
  reasonLabel: string;
  sourceKind: PersonalizedHomeRailSourceKind;
}

export interface PersonalizedHomeRail {
  kind: PersonalizedHomeRailKind;
  railId?: string;
  title: string;
  trendScope?: PersonalizedHomeTrendScope;
  items: PersonalizedHomeQuizItem[];
}

export interface PersonalizedHomeContinueItem {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  lastPlayedLabel: string;
  streak: number;
  daysOfWeek: boolean[];
}

export interface PersonalizedHomeDailyChallenge {
  gameId: string;
  gameType: string;
  displayName: string;
  gameNumber: number;
  isCompleted: boolean;
  solved?: boolean;
  guessCount?: number;
  maxGuesses: number;
}

export interface PersonalizedHomeStarterCollection {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
}

export interface PersonalizedHomePayload {
  generatedAt: string;
  userSummary: {
    userId: string;
    displayName: string;
    currentStreak: number;
    longestStreak: number;
  };
  continuePlaying: PersonalizedHomeContinueItem[];
  dailyChallenge: PersonalizedHomeDailyChallenge | null;
  rails: PersonalizedHomeRail[];
  starterCollections: PersonalizedHomeStarterCollection[];
}
