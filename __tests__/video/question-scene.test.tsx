import React from "react";
import { render, screen } from "@testing-library/react";
import { QuestionScene } from "@/video/components/QuestionScene";

let mockedFrame = 0;

jest.mock("remotion", () => {
  const React = require("react");

  const interpolate = (
    value: number,
    input: [number, number],
    output: [number, number],
    options?: { extrapolateLeft?: string; extrapolateRight?: string }
  ) => {
    const [inStart, inEnd] = input;
    const [outStart, outEnd] = output;
    let current = value;

    if (current < inStart && options?.extrapolateLeft === "clamp") current = inStart;
    if (current > inEnd && options?.extrapolateRight === "clamp") current = inEnd;

    const progress = (current - inStart) / (inEnd - inStart);
    return outStart + (outEnd - outStart) * progress;
  };

  return {
    AbsoluteFill: ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
      <div style={style}>{children}</div>
    ),
    Audio: ({ src }: { src: string }) => <div data-testid="audio" data-src={src} />,
    Img: ({ src, style }: { src: string; style?: React.CSSProperties }) => <img src={src} style={style} alt="" />,
    Sequence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    interpolate,
    spring: () => 1,
    staticFile: (assetPath: string) => `/${assetPath.replace(/^\//, "")}`,
    useCurrentFrame: () => mockedFrame,
  };
});

const buildQuestion = () => ({
  id: "q_1",
  order: 0,
  questionText: "Who won the title?",
  timeLimitSeconds: 30,
  options: ["Option A", "Option B", "Option C", "Option D"],
  correctAnswerIndex: 0,
  voiceoverSrc: null,
});

describe("QuestionScene answer reveal", () => {
  beforeEach(() => {
    mockedFrame = 940;
  });

  it("hides answer label/highlight and reveal sfx when showAnswerReveal=false", () => {
    render(
      <QuestionScene
        fps={30}
        question={buildQuestion()}
        index={0}
        total={10}
        videoFormat="landscape"
        showAnswerReveal={false}
      />
    );

    expect(screen.queryByText(/^Answer:/i)).not.toBeInTheDocument();
    expect(screen.getByText("Think fast. Pick your answer before timer ends.")).toBeInTheDocument();

    const optionCard = screen.getByText("OPTION A").parentElement;
    expect(optionCard).not.toBeNull();
    expect(optionCard).toHaveStyle("background: #FFFFFF");

    const audioSrcs = screen.getAllByTestId("audio").map((node) => node.getAttribute("data-src"));
    expect(audioSrcs).not.toContain("/video/sfx/answer-reveal.wav");
  });

  it("shows answer label/highlight and reveal sfx when showAnswerReveal=true", () => {
    render(
      <QuestionScene
        fps={30}
        question={buildQuestion()}
        index={0}
        total={10}
        videoFormat="landscape"
        showAnswerReveal={true}
      />
    );

    expect(screen.getByText("Answer: A")).toBeInTheDocument();

    const optionCard = screen.getByText("OPTION A").parentElement;
    expect(optionCard).not.toBeNull();
    expect(optionCard).toHaveStyle("background: rgba(15,118,110,0.12)");

    const audioSrcs = screen.getAllByTestId("audio").map((node) => node.getAttribute("data-src"));
    expect(audioSrcs).toContain("/video/sfx/answer-reveal.wav");
  });
});
