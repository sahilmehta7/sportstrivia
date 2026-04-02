import { DEFAULT_FPS, DEFAULT_LOGO_CORNER, DEFAULT_THEME_VARIANT } from "./constants";
import type { QuizYoutubeLandscapeProps } from "./types";

export const SAMPLE_QUIZ_VIDEO_PROPS: QuizYoutubeLandscapeProps = {
  fps: DEFAULT_FPS,
  videoFormat: "landscape",
  showAnswerReveal: true,
  themeVariant: DEFAULT_THEME_VARIANT,
  logoCorner: DEFAULT_LOGO_CORNER,
  quiz: {
    id: "sample-quiz-id",
    slug: "sample-sports-quiz",
    title: "Ultimate Sports Trivia Challenge",
    sport: "Mixed Sports",
    difficulty: "MEDIUM",
    coverImageUrl: null,
  },
  ctaUrl: "https://www.sportstrivia.in/quizzes/sample-sports-quiz",
  questions: [
    {
      id: "q1",
      order: 0,
      questionText: "Which country has won the most FIFA World Cup titles?",
      timeLimitSeconds: 30,
      options: ["Brazil", "Germany", "Italy", "Argentina"],
      correctAnswerIndex: 0,
      voiceoverSrc: null,
    },
    {
      id: "q2",
      order: 1,
      questionText: "In tennis, what is the term for a score of zero?",
      timeLimitSeconds: 25,
      options: ["Love", "Nil", "Duck", "Blank"],
      correctAnswerIndex: 0,
      voiceoverSrc: null,
    },
    {
      id: "q3",
      order: 2,
      questionText: "Which NBA player is known as 'King James'?",
      timeLimitSeconds: 20,
      options: ["Kobe Bryant", "LeBron James", "Kevin Durant", "Giannis Antetokounmpo"],
      correctAnswerIndex: 1,
      voiceoverSrc: null,
    },
  ],
};
