import React from "react";
import { render, screen } from "@testing-library/react";
import { ShortsQuestionScene } from "@/video/shorts/ShortsQuestionScene";
import { resolveShortsTheme } from "@/video/shorts/themes";

let mockedFrame = 0;

jest.mock("remotion", () => {
  const React = require("react");

  return {
    AbsoluteFill: ({
      children,
      style,
      ...rest
    }: {
      children: React.ReactNode;
      style?: React.CSSProperties;
      [key: string]: unknown;
    }) => (
      <div style={style} {...rest}>
        {children}
      </div>
    ),
    Audio: ({ src }: { src: string }) => <div data-testid="audio" data-src={src} />,
    Sequence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    spring: () => 1,
    staticFile: (assetPath: string) => `/${assetPath.replace(/^\//, "")}`,
    useCurrentFrame: () => mockedFrame,
  };
});

const buildQuestion = (questionText: string) => ({
  id: "q_1",
  order: 0,
  questionText,
  timeLimitSeconds: 30,
  options: ["mujeeb ur rahman", "rashid khan", "naveen-ul-haq", "noor ahmad"],
  correctAnswerIndex: 1,
  voiceoverSrc: null,
});

describe("ShortsQuestionScene", () => {
  beforeEach(() => {
    mockedFrame = 20;
  });

  it("uses strict safe-zone padding container", () => {
    render(
      <ShortsQuestionScene
        fps={30}
        question={buildQuestion("Which spinner became the youngest player to take five wickets?")}
        index={0}
        total={10}
        showAnswerReveal={true}
        theme={resolveShortsTheme("dark")}
      />
    );

    const container = screen.getByTestId("shorts-safe-zone");
    expect(container).toHaveStyle("padding: 172px 40px 236px");
    expect(container).toHaveStyle("justify-content: center");
    expect(container).toHaveStyle("overflow: hidden");
  });

  it("renders options in title case and preserves common name tokens", () => {
    const question = buildQuestion("which player was called o'neal in the nba?");
    question.options = ["o'neal", "ab de villiers", "MS dhoni", "naveen-ul-haq"];

    render(
      <ShortsQuestionScene
        fps={30}
        question={question}
        index={0}
        total={10}
        showAnswerReveal={true}
        theme={resolveShortsTheme("dark")}
      />
    );

    expect(screen.getByText("O'Neal")).toBeInTheDocument();
    expect(screen.getByText("AB de Villiers")).toBeInTheDocument();
    expect(screen.getByText("MS Dhoni")).toBeInTheDocument();
    expect(screen.queryByText("O'NEAL")).not.toBeInTheDocument();
  });

  it("uses intrinsic, non-stretching options grid", () => {
    render(
      <ShortsQuestionScene
        fps={30}
        question={buildQuestion("Which spinner became the youngest player to take five wickets?")}
        index={0}
        total={10}
        showAnswerReveal={true}
        theme={resolveShortsTheme("dark")}
      />
    );

    const grid = screen.getByTestId("shorts-options-grid");
    expect(grid).toHaveStyle("grid-auto-rows: min-content");
    expect(grid).toHaveStyle("align-content: start");
  });

  it("switches to long-question compact density tier", () => {
    const longQuestion =
      "Which Afghanistan spinner became the youngest player in ODI history to claim a five-wicket haul, setting the record during a high-pressure match while still in his teens and announcing himself on the global stage?";

    render(
      <ShortsQuestionScene
        fps={30}
        question={buildQuestion(longQuestion)}
        index={0}
        total={10}
        showAnswerReveal={true}
        theme={resolveShortsTheme("flare")}
      />
    );

    const optionCard = screen.getByText("Mujeeb Ur Rahman").parentElement;
    expect(optionCard).not.toBeNull();
    expect(optionCard).toHaveStyle("min-height: 58px");
  });
});
