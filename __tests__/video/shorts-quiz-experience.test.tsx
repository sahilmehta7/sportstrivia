import React from "react";
import { render, screen } from "@testing-library/react";
import {
  ShortsQuizExperience,
  SHORTS_HOOK_DEFAULTS,
  getShortsHookFrames,
} from "@/video/shorts/ShortsQuizExperience";

jest.mock("remotion", () => {
  const React = require("react");
  const Series = ({ children }: { children: React.ReactNode }) => <div data-testid="series">{children}</div>;
  const Sequence = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  (Series as { Sequence?: unknown }).Sequence = Sequence;
  return {
    AbsoluteFill: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Audio: ({ src }: { src: string }) => <div data-testid="audio" data-src={src} />,
    Series,
    staticFile: (assetPath: string) => `/${assetPath.replace(/^\//, "")}`,
  };
});

jest.mock("@/video/shorts/ShortsLayeredBackground", () => ({
  ShortsLayeredBackground: () => <div data-testid="shorts-bg" />,
}));
jest.mock("@/video/shorts/ShortsCornerLogo", () => ({
  ShortsCornerLogo: () => <div data-testid="shorts-logo" />,
}));
jest.mock("@/video/shorts/ShortsHookScene", () => ({
  ShortsHookScene: () => <div data-testid="shorts-hook-scene" />,
}));
jest.mock("@/video/shorts/ShortsIntroScene", () => ({
  ShortsIntroScene: () => <div data-testid="shorts-intro-scene" />,
}));
jest.mock("@/video/shorts/ShortsQuestionScene", () => ({
  ShortsQuestionScene: () => <div data-testid="shorts-question-scene" />,
}));
jest.mock("@/video/shorts/ShortsOutroScene", () => ({
  ShortsOutroScene: () => <div data-testid="shorts-outro-scene" />,
}));

const buildProps = () => ({
    fps: 30,
    themeVariant: "dark" as const,
    showAnswerReveal: true,
    ctaUrl: "https://example.com/play",
    quiz: {
      id: "quiz_1",
      title: "Daily Cricket Quiz",
      slug: "daily-cricket-quiz",
      sport: "Cricket",
      difficulty: "Medium",
      coverImageUrl: null,
    },
    questions: [
      {
        id: "q_1",
        order: 0,
        questionText: "Who won?",
        timeLimitSeconds: 10,
        options: ["A", "B", "C", "D"],
        correctAnswerIndex: 1,
        voiceoverSrc: null,
      },
    ],
  });

describe("ShortsQuizExperience", () => {
  it("uses default hook config and frame conversion", () => {
    expect(SHORTS_HOOK_DEFAULTS.hookEnabled).toBe(true);
    expect(SHORTS_HOOK_DEFAULTS.hookDurationMs).toBe(800);
    expect(SHORTS_HOOK_DEFAULTS.hookStyle).toBe("sport-aware-template");
    expect(getShortsHookFrames(30)).toBe(24);
  });

  it("renders hook before intro/question/outro pipeline", () => {
    render(<ShortsQuizExperience {...buildProps()} />);

    const hook = screen.getByTestId("shorts-hook-scene");
    const intro = screen.getByTestId("shorts-intro-scene");
    const question = screen.getByTestId("shorts-question-scene");
    const outro = screen.getByTestId("shorts-outro-scene");
    expect(hook.compareDocumentPosition(intro) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(intro.compareDocumentPosition(question) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(question.compareDocumentPosition(outro) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
