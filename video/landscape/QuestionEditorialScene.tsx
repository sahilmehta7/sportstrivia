import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import type { QuizVideoQuestion } from "../types";
import type { LandscapeTheme } from "./themes";
import { landscapeBodyFont, landscapeHeadlineFont } from "./themes";

type RevealVariant = "flash" | "focus";

type QuestionEditorialSceneProps = {
  fps: number;
  question: QuizVideoQuestion;
  index: number;
  totalQuestions: number;
  sectionIndex: number;
  sectionTitle: string;
  thinkingFrames: number;
  revealFrames: number;
  holdFrames: number;
  showAnswerReveal: boolean;
  theme: LandscapeTheme;
};

const revealVariantFor = (index: number): RevealVariant => {
  return index % 2 === 0 ? "flash" : "focus";
};

const optionLabel = (optionIndex: number) => String.fromCharCode(65 + optionIndex);

export const QuestionEditorialScene: React.FC<QuestionEditorialSceneProps> = ({
  fps,
  question,
  index,
  totalQuestions,
  sectionIndex,
  sectionTitle,
  thinkingFrames,
  revealFrames,
  holdFrames,
  showAnswerReveal,
  theme,
}) => {
  const frame = useCurrentFrame();
  const revealVariant = revealVariantFor(index);
  const introProgress = spring({
    frame,
    fps,
    config: { damping: 170 },
  });

  const revealStart = thinkingFrames;
  const revealActive = showAnswerReveal && frame >= revealStart && frame <= revealStart + revealFrames;
  const revealProgress = interpolate(frame, [revealStart, revealStart + revealFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const frameInThinkingWindow = Math.max(0, Math.min(frame, thinkingFrames));
  const countdownSeconds = Math.max(0, Math.ceil((thinkingFrames - frameInThinkingWindow) / fps));
  const timerProgress = frameInThinkingWindow / Math.max(1, thinkingFrames);
  const isUrgent = countdownSeconds <= 5;

  const questionText = question.questionText.trim();
  const points = (index + 1) * 10;

  return (
    <AbsoluteFill style={{ padding: "110px 90px 84px", color: theme.text.primary }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 28,
          opacity: introProgress,
        }}
      >
        <div
          style={{
            fontFamily: landscapeBodyFont,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: theme.text.secondary,
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          Round {sectionIndex + 1} | {sectionTitle}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: `1px solid ${theme.surfaces.panelBorder}`,
              background: theme.surfaces.panel,
              fontFamily: landscapeBodyFont,
              fontWeight: 700,
              fontSize: 17,
              color: theme.text.secondary,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            Q {index + 1}/{totalQuestions}
          </div>
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              border: `1px solid ${theme.surfaces.panelBorder}`,
              background: theme.surfaces.panel,
              fontFamily: landscapeBodyFont,
              fontWeight: 800,
              fontSize: 17,
              color: theme.text.accent,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            +{points} pts
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 24,
          alignItems: "stretch",
          flex: 1,
        }}
      >
        <div
          style={{
            borderRadius: 26,
            border: `1px solid ${theme.surfaces.panelBorder}`,
            background: theme.surfaces.panel,
            boxShadow: "0 22px 44px rgba(0,0,0,0.28)",
            padding: "34px 38px",
            opacity: introProgress,
            transform: `translateY(${interpolate(introProgress, [0, 1], [20, 0])}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 20,
            }}
          >
            <div
              style={{
                fontFamily: landscapeBodyFont,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: theme.text.muted,
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              Trivia prompt
            </div>
            <div
              style={{
                minWidth: 260,
                borderRadius: 14,
                border: `1px solid ${theme.surfaces.panelBorder}`,
                background: theme.surfaces.softPanel,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  fontFamily: landscapeBodyFont,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: theme.text.muted,
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Clock
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontFamily: landscapeHeadlineFont,
                  fontSize: 64,
                  lineHeight: 0.84,
                  color: isUrgent ? theme.timer.urgent : theme.timer.fill,
                  letterSpacing: "-0.03em",
                }}
              >
                {String(countdownSeconds).padStart(2, "0")}
              </div>
              <div
                style={{
                  marginTop: 8,
                  height: 6,
                  borderRadius: 999,
                  background: theme.timer.track,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.max(0, (1 - timerProgress) * 100)}%`,
                    background: isUrgent ? theme.timer.urgent : theme.timer.fill,
                  }}
                />
              </div>
            </div>
          </div>
          <h2
            style={{
              margin: "14px 0 0",
              fontFamily: landscapeHeadlineFont,
              fontSize: questionText.length > 100 ? 52 : questionText.length > 70 ? 58 : 64,
              lineHeight: 1.02,
              letterSpacing: "-0.015em",
              textWrap: "balance",
            }}
          >
            {questionText}
          </h2>

          <div
            style={{
              marginTop: 26,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            {question.options.slice(0, 4).map((option, optionIndex) => {
              const correct = optionIndex === question.correctAnswerIndex;
              const revealBase = revealActive && correct;
              return (
                <div
                  key={`${question.id}-option-${optionIndex}`}
                  style={{
                    minHeight: 88,
                    borderRadius: 16,
                    border: `1px solid ${revealBase ? theme.text.reveal : theme.surfaces.panelBorder}`,
                    background: revealBase ? "rgba(125, 255, 178, 0.12)" : theme.surfaces.softPanel,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      border: `1px solid ${theme.surfaces.panelBorder}`,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: landscapeHeadlineFont,
                      fontWeight: 800,
                      fontSize: 20,
                      color: revealBase ? theme.text.reveal : theme.text.secondary,
                    }}
                  >
                    {optionLabel(optionIndex)}
                  </div>
                  <div
                    style={{
                      fontFamily: landscapeBodyFont,
                      textTransform: "uppercase",
                      fontWeight: 700,
                      fontSize: 29,
                      lineHeight: 1.15,
                      letterSpacing: "0.01em",
                      color: revealBase ? theme.text.reveal : theme.text.primary,
                    }}
                  >
                    {option}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {revealActive ? (
        <div
          style={{
            position: "absolute",
            left: 90,
            right: 90,
            bottom: 52,
            borderRadius: 18,
            border: `1px solid ${theme.surfaces.panelBorder}`,
            background:
              revealVariant === "flash"
                ? `linear-gradient(120deg, rgba(20,40,60,0.8) 0%, rgba(40,95,76,0.82) 100%)`
                : theme.surfaces.overlay,
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            opacity: revealProgress,
            transform: `translateY(${interpolate(revealProgress, [0, 1], [16, 0])}px)`,
            boxShadow: "0 14px 28px rgba(0,0,0,0.28)",
          }}
        >
          <div
            style={{
              fontFamily: landscapeHeadlineFont,
              textTransform: "uppercase",
              fontSize: 54,
              lineHeight: 0.85,
              letterSpacing: "-0.01em",
              color: theme.text.reveal,
            }}
          >
            Correct answer: {optionLabel(question.correctAnswerIndex)}
          </div>
          <div
            style={{
              fontFamily: landscapeBodyFont,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 800,
              color: theme.text.secondary,
              fontSize: 18,
            }}
          >
            Great reveal pacing
          </div>
        </div>
      ) : null}

      {Array.from({ length: Math.min(5, Math.ceil(thinkingFrames / fps)) }).map((_, tickIndex) => {
        const startFromSecond = Math.max(0, Math.ceil(thinkingFrames / fps) - 5);
        const secondIndex = startFromSecond + tickIndex;
        return (
          <Sequence
            key={`tick-${question.id}-${secondIndex}`}
            from={secondIndex * fps}
            durationInFrames={Math.max(1, Math.floor(0.12 * fps))}
          >
            <Audio src={staticFile("video/sfx/tick-soft.wav")} volume={0.38} />
          </Sequence>
        );
      })}

      {showAnswerReveal ? (
        <>
          <Sequence from={revealStart} durationInFrames={Math.max(1, Math.floor(0.28 * fps))}>
            <Audio src={staticFile("video/sfx/answer-reveal.wav")} volume={0.6} />
          </Sequence>
          <Sequence from={revealStart} durationInFrames={Math.max(1, Math.floor(0.34 * fps))}>
            <Audio src={staticFile("video/sfx/transition-stinger.wav")} volume={0.45} />
          </Sequence>
        </>
      ) : null}

      {question.voiceoverSrc ? (
        <Sequence from={0} durationInFrames={thinkingFrames + revealFrames + holdFrames}>
          <Audio src={staticFile(question.voiceoverSrc.replace(/^\//, ""))} volume={0.85} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
