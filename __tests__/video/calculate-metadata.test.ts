import { calculateVideoMetadata } from "@/video/calculate-video-metadata";
import { loadQuizForVideo } from "@/video/load-quiz-for-video";

jest.mock("@/video/load-quiz-for-video", () => ({
  loadQuizForVideo: jest.fn(),
}));

const mockedLoadQuizForVideo = loadQuizForVideo as jest.MockedFunction<typeof loadQuizForVideo>;

describe("calculateVideoMetadata", () => {
  beforeEach(() => {
    mockedLoadQuizForVideo.mockResolvedValue({
      quiz: {
        id: "quiz_1",
        slug: "football-icons",
        title: "Football Icons",
        sport: "Football",
        difficulty: "MEDIUM",
        coverImageUrl: null,
      },
      defaults: {
        timePerQuestion: 30,
      },
      selectionSeed: "daily:football-icons:2026-04-02",
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
        {
          id: "q2",
          order: 1,
          questionText: "Q2",
          timeLimitSeconds: 30,
          options: ["A", "B", "C", "D"],
          correctAnswerIndex: 1,
          voiceoverSrc: null,
        },
      ],
    });
  });

  it("returns duration and outName based on loaded quiz payload", async () => {
    const metadata = await calculateVideoMetadata({
      quizSlug: "football-icons",
      fps: 30,
      themeVariant: "dark",
      logoCorner: "top-right",
    });

    // cover 60 + intro 75 + questions (2 * 990) + outro 90
    expect(metadata.durationInFrames).toBe(2205);
    expect(metadata.defaultOutName).toBe("football-icons-youtube-landscape.mp4");
    expect(metadata.props.questions).toHaveLength(2);
    expect(metadata.props.showAnswerReveal).toBe(true);
    expect(metadata.props.videoFormat).toBe("landscape");
  });

  it("propagates showAnswerReveal when explicitly disabled", async () => {
    const metadata = await calculateVideoMetadata({
      quizSlug: "football-icons",
      fps: 30,
      showAnswerReveal: false,
      themeVariant: "dark",
      logoCorner: "top-right",
    });

    expect(metadata.props.showAnswerReveal).toBe(false);
  });

  it("supports shorts format in metadata props and output name", async () => {
    const metadata = await calculateVideoMetadata({
      quizSlug: "football-icons",
      fps: 30,
      videoFormat: "shorts",
      themeVariant: "dark",
      logoCorner: "top-right",
    });

    expect(metadata.props.videoFormat).toBe("shorts");
    expect(metadata.defaultOutName).toBe("football-icons-youtube-shorts.mp4");
  });

  it("computes duration from per-question time limits", async () => {
    mockedLoadQuizForVideo.mockResolvedValueOnce({
      quiz: {
        id: "quiz_2",
        slug: "mixed-timers",
        title: "Mixed Timers",
        sport: "Football",
        difficulty: "MEDIUM",
        coverImageUrl: null,
      },
      defaults: {
        timePerQuestion: 30,
      },
      selectionSeed: "daily:mixed-timers:2026-04-02",
      ctaUrl: "https://www.sportstrivia.in/quizzes/mixed-timers",
      questions: [
        {
          id: "q1",
          order: 0,
          questionText: "Q1",
          timeLimitSeconds: 10,
          options: ["A", "B", "C", "D"],
          correctAnswerIndex: 0,
          voiceoverSrc: null,
        },
        {
          id: "q2",
          order: 1,
          questionText: "Q2",
          timeLimitSeconds: 20,
          options: ["A", "B", "C", "D"],
          correctAnswerIndex: 1,
          voiceoverSrc: null,
        },
        {
          id: "q3",
          order: 2,
          questionText: "Q3",
          timeLimitSeconds: 30,
          options: ["A", "B", "C", "D"],
          correctAnswerIndex: 2,
          voiceoverSrc: null,
        },
      ],
    });

    const metadata = await calculateVideoMetadata({
      quizSlug: "mixed-timers",
      fps: 30,
      themeVariant: "dark",
      logoCorner: "top-right",
    });

    // cover 60 + intro 75 + (390 + 690 + 990) + outro 90
    expect(metadata.durationInFrames).toBe(2295);
  });
});
