import { calculateCompositionMetadata } from "@/video/calculate-metadata";
import { VIDEO_HEIGHT, VIDEO_SHORTS_HEIGHT, VIDEO_SHORTS_WIDTH, VIDEO_WIDTH } from "@/video/constants";
import type { QuizYoutubeLandscapeProps } from "@/video/types";

const buildProps = (
  videoFormat: "landscape" | "shorts",
  themeVariant: "dark" | "flare" | "ice" = "dark"
): QuizYoutubeLandscapeProps => ({
  fps: 30,
  videoFormat,
  showAnswerReveal: true,
  themeVariant,
  logoCorner: "top-right",
  quiz: {
    id: "quiz_1",
    slug: "football-icons",
    title: "Football Icons",
    sport: "Football",
    difficulty: "MEDIUM",
    coverImageUrl: null,
  },
  ctaUrl: "https://www.sportstrivia.in/quizzes/football-icons",
  questions: [
    {
      id: "q1",
      order: 0,
      questionText: "Q1",
      timeLimitSeconds: 30,
      options: ["A", "B", "C", "D"],
      correctAnswerIndex: 0,
      voiceoverSrc: null,
    },
  ],
});

describe("calculateCompositionMetadata", () => {
  it("uses format-aware output naming and dimensions", async () => {
    const landscape = await calculateCompositionMetadata({
      props: buildProps("landscape"),
      defaultProps: buildProps("landscape"),
      abortSignal: new AbortController().signal,
      compositionId: "QuizYoutubeLandscape",
      isRendering: false,
    });
    expect(landscape.defaultOutName).toBe("football-icons-youtube-landscape.mp4");
    expect(landscape.width).toBe(VIDEO_WIDTH);
    expect(landscape.height).toBe(VIDEO_HEIGHT);
    // title 135 + section divider 48 + question 993 + fact 66 + outro 126
    expect(landscape.durationInFrames).toBe(1368);

    const shorts = await calculateCompositionMetadata({
      props: buildProps("shorts", "flare"),
      defaultProps: buildProps("shorts", "flare"),
      abortSignal: new AbortController().signal,
      compositionId: "QuizYoutubeLandscape",
      isRendering: false,
    });
    expect(shorts.defaultOutName).toBe("football-icons-youtube-shorts-flare.mp4");
    expect(shorts.width).toBe(VIDEO_SHORTS_WIDTH);
    expect(shorts.height).toBe(VIDEO_SHORTS_HEIGHT);
    expect(shorts.durationInFrames).toBe(1155);
  });
});
