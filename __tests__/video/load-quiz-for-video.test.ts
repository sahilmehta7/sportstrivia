import {
  resolveQuestionTimeLimit,
  sanitizeQuestionForVideo,
  seededShuffle,
  selectQuestionsForVideo,
  selectQuestionsFromTopicSets,
  shouldUseDailyTopicFallback,
} from "@/video/load-quiz-for-video";

describe("load-quiz-for-video helpers", () => {
  it("falls back to quiz time-per-question when question timeLimit is missing", () => {
    expect(resolveQuestionTimeLimit(undefined, 22)).toBe(22);
  });

  it("falls back to default when both question and quiz time limits are missing", () => {
    expect(resolveQuestionTimeLimit(undefined, undefined)).toBe(30);
  });

  it("sanitizes into scene-safe payload while keeping options and correct answer index", () => {
    const sanitized = sanitizeQuestionForVideo({
      order: 0,
      quizSlug: "legends-of-the-ipl-quiz",
      fallbackQuizTimePerQuestion: 25,
      question: {
        id: "q_1",
        questionText: "Who won the 2019 Cricket World Cup?",
        timeLimit: null,
        answers: [
          { id: "a1", answerText: "England", isCorrect: true },
          { id: "a2", answerText: "New Zealand", isCorrect: false },
        ],
      },
    });

    expect(sanitized).toEqual({
      id: "q_1",
      order: 0,
      questionText: "Who won the 2019 Cricket World Cup?",
      timeLimitSeconds: 25,
      options: ["England", "New Zealand"],
      correctAnswerIndex: 0,
      voiceoverSrc: "/video/voiceovers/legends-of-the-ipl-quiz/q-01.mp3",
    });
    expect((sanitized as Record<string, unknown>).answers).toBeUndefined();
    expect((sanitized as Record<string, unknown>).isCorrect).toBeUndefined();
  });

  it("uses only the first four options when computing correctAnswerIndex", () => {
    expect(() =>
      sanitizeQuestionForVideo({
        order: 0,
        quizSlug: "legends-of-the-ipl-quiz",
        fallbackQuizTimePerQuestion: 25,
        question: {
          id: "q_2",
          questionText: "Which club won this year?",
          timeLimit: null,
          answers: [
            { id: "a1", answerText: "A", isCorrect: false },
            { id: "a2", answerText: "B", isCorrect: false },
            { id: "a3", answerText: "C", isCorrect: false },
            { id: "a4", answerText: "D", isCorrect: false },
            { id: "a5", answerText: "E", isCorrect: true },
          ],
        },
      })
    ).toThrow(/no correct answer configured/i);
  });

  it("enables topic fallback for daily recurring quizzes", () => {
    expect(shouldUseDailyTopicFallback({ recurringType: "DAILY", attemptResetPeriod: "NEVER" })).toBe(true);
    expect(shouldUseDailyTopicFallback({ recurringType: "NONE", attemptResetPeriod: "DAILY" })).toBe(true);
    expect(shouldUseDailyTopicFallback({ recurringType: "NONE", attemptResetPeriod: "NEVER" })).toBe(false);
  });

  it("selects from topic sets deterministically for FIXED mode", () => {
    const selected = selectQuestionsFromTopicSets("FIXED", [
      {
        questionCount: 1,
        questions: [
          { id: "q1", questionText: "Q1", answers: [{ id: "a1", answerText: "A1", isCorrect: true }] },
          { id: "q2", questionText: "Q2", answers: [{ id: "a2", answerText: "A2", isCorrect: true }] },
        ],
      },
      {
        questionCount: 1,
        questions: [{ id: "q3", questionText: "Q3", answers: [{ id: "a3", answerText: "A3", isCorrect: true }] }],
      },
    ] as any);

    expect(selected.map((q: any) => q.id)).toEqual(["q1", "q3"]);
  });

  it("randomizes question-pool sourcing before applying question limit", () => {
    const selected = selectQuestionsForVideo({
      questions: ["q1", "q2", "q3", "q4"],
      maxQuestions: 2,
      shuffle: true,
      seed: "episode-1",
      shuffler: (items, _seed) => [...items].reverse(),
    });

    expect(selected).toEqual(["q4", "q3"]);
  });

  it("does not shuffle when shuffle=false", () => {
    const selected = selectQuestionsForVideo({
      questions: ["q1", "q2", "q3", "q4"],
      maxQuestions: 2,
      shuffle: false,
      seed: "episode-1",
      shuffler: (items, _seed) => [...items].reverse(),
    });

    expect(selected).toEqual(["q1", "q2"]);
  });

  it("produces stable ordering for same seed", () => {
    const items = ["q1", "q2", "q3", "q4", "q5", "q6"];
    const first = seededShuffle(items, "stable-seed");
    const second = seededShuffle(items, "stable-seed");
    expect(first).toEqual(second);
  });

  it("produces different ordering for different seeds", () => {
    const items = ["q1", "q2", "q3", "q4", "q5", "q6"];
    const first = seededShuffle(items, "seed-a");
    const second = seededShuffle(items, "seed-b");
    expect(first).not.toEqual(second);
  });

  it("keeps daily topic-random selection deterministic for same ordered source and seed", () => {
    const topicSets = [
      {
        questionCount: 2,
        questions: [
          { id: "q1", questionText: "Q1", answers: [{ id: "a1", answerText: "A1", isCorrect: true }] },
          { id: "q2", questionText: "Q2", answers: [{ id: "a2", answerText: "A2", isCorrect: true }] },
          { id: "q3", questionText: "Q3", answers: [{ id: "a3", answerText: "A3", isCorrect: true }] },
        ],
      },
      {
        questionCount: 1,
        questions: [
          { id: "q4", questionText: "Q4", answers: [{ id: "a4", answerText: "A4", isCorrect: true }] },
          { id: "q5", questionText: "Q5", answers: [{ id: "a5", answerText: "A5", isCorrect: true }] },
        ],
      },
    ] as any;

    const first = selectQuestionsFromTopicSets("TOPIC_RANDOM", topicSets, "daily:quiz:2026-04-02").map((q: any) => q.id);
    const second = selectQuestionsFromTopicSets("TOPIC_RANDOM", topicSets, "daily:quiz:2026-04-02").map((q: any) => q.id);

    expect(first).toEqual(second);
  });
});
