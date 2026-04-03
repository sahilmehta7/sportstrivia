export type ReelsPlanItem = {
  publishDate: string;
  platform: "instagram" | "youtube";
  quizSlug: string;
  themeVariant: "dark" | "flare" | "ice";
  questionLimit: number;
  questionTimeLimitSeconds: number;
  showAnswerReveal: boolean;
  postLabel: string;
};

export const REELS_PLAN_APRIL_2026: ReelsPlanItem[] = [
  {
    publishDate: "2026-04-06",
    platform: "instagram",
    quizSlug: "afghanistan-cricket-quiz",
    themeVariant: "flare",
    questionLimit: 6,
    questionTimeLimitSeconds: 10,
    showAnswerReveal: true,
    postLabel: "Can you beat today's cricket quiz?",
  },
  {
    publishDate: "2026-04-09",
    platform: "instagram",
    quizSlug: "dual-sport-footballers-elite-quiz",
    themeVariant: "ice",
    questionLimit: 6,
    questionTimeLimitSeconds: 10,
    showAnswerReveal: true,
    postLabel: "Premier League rivals rapid-fire",
  },
  {
    publishDate: "2026-04-11",
    platform: "youtube",
    quizSlug: "2007-t20-world-cup-quiz",
    themeVariant: "dark",
    questionLimit: 7,
    questionTimeLimitSeconds: 9,
    showAnswerReveal: true,
    postLabel: "5 T20 trivia in 30s",
  },
  {
    publishDate: "2026-04-13",
    platform: "instagram",
    quizSlug: "daily-badminton-quiz",
    themeVariant: "flare",
    questionLimit: 6,
    questionTimeLimitSeconds: 9,
    showAnswerReveal: true,
    postLabel: "Daily badminton streak challenge",
  },
  {
    publishDate: "2026-04-17",
    platform: "instagram",
    quizSlug: "le-mans-endurance-masterclass",
    themeVariant: "dark",
    questionLimit: 6,
    questionTimeLimitSeconds: 10,
    showAnswerReveal: true,
    postLabel: "Le Mans true or false?",
  },
  {
    publishDate: "2026-04-19",
    platform: "youtube",
    quizSlug: "rugby-world-cup-quiz",
    themeVariant: "ice",
    questionLimit: 7,
    questionTimeLimitSeconds: 9,
    showAnswerReveal: true,
    postLabel: "Rugby World Cup quick quiz",
  },
  {
    publishDate: "2026-04-20",
    platform: "instagram",
    quizSlug: "test-cricket-rarest-feats-modern-marvels-scorecard-oddities-quiz",
    themeVariant: "dark",
    questionLimit: 6,
    questionTimeLimitSeconds: 10,
    showAnswerReveal: true,
    postLabel: "This week's hardest quiz categories",
  },
  {
    publishDate: "2026-04-23",
    platform: "instagram",
    quizSlug: "new-zealand-cricket-vault",
    themeVariant: "ice",
    questionLimit: 6,
    questionTimeLimitSeconds: 10,
    showAnswerReveal: true,
    postLabel: "UCL winner crossover grid style challenge",
  },
  {
    publishDate: "2026-04-25",
    platform: "youtube",
    quizSlug: "daily-basketball-trivia",
    themeVariant: "flare",
    questionLimit: 7,
    questionTimeLimitSeconds: 9,
    showAnswerReveal: true,
    postLabel: "Cricket oddities quiz short",
  },
  {
    publishDate: "2026-04-27",
    platform: "instagram",
    quizSlug: "the-ultimate-ranji-trophy-quiz",
    themeVariant: "dark",
    questionLimit: 6,
    questionTimeLimitSeconds: 10,
    showAnswerReveal: true,
    postLabel: "April champion challenge finale",
  },
  {
    publishDate: "2026-04-29",
    platform: "instagram",
    quizSlug: "2011-cricket-world-cup-quiz",
    themeVariant: "flare",
    questionLimit: 6,
    questionTimeLimitSeconds: 10,
    showAnswerReveal: true,
    postLabel: "Best scores of April recap",
  },
  {
    publishDate: "2026-04-30",
    platform: "youtube",
    quizSlug: "prowess-in-other-sports-quiz",
    themeVariant: "ice",
    questionLimit: 8,
    questionTimeLimitSeconds: 9,
    showAnswerReveal: true,
    postLabel: "Month-end mega trivia battle",
  },
];

