import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { athleticDarkTokens, athleticTypography } from "../style-tokens";
import {
  getQuestionActiveFramesForSeconds,
  getQuestionBufferFrames,
  getQuestionEntranceFrames,
} from "../timing";
import type { QuizVideoQuestion } from "../types";

type QuestionSceneProps = {
  fps: number;
  question: QuizVideoQuestion;
  index: number;
  total: number;
  showAnswerReveal: boolean;
};

export const QuestionScene: React.FC<QuestionSceneProps> = ({
  fps,
  question,
  index,
  total,
  showAnswerReveal,
}) => {
  const frame = useCurrentFrame();
  const entranceFrames = getQuestionEntranceFrames(fps);
  const activeFrames = getQuestionActiveFramesForSeconds(question.timeLimitSeconds, fps);
  const bufferFrames = getQuestionBufferFrames(fps);

  const enterProgress = spring({
    frame,
    fps,
    config: {
      damping: 200,
    },
  });

  const cardOpacity = interpolate(enterProgress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cardTranslateY = interpolate(enterProgress, [0, 1], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const timerFrame = Math.max(frame - entranceFrames, 0);
  const elapsedSeconds = Math.floor(timerFrame / fps);
  const activeSeconds = Math.max(1, question.timeLimitSeconds);
  const countdownSeconds = Math.max(0, activeSeconds - elapsedSeconds);
  const timerProgress = Math.min(timerFrame / activeFrames, 1);
  const isUrgent = countdownSeconds <= 3;
  const isRevealPhase = showAnswerReveal && timerFrame >= activeFrames;
  const isBufferSection = frame >= entranceFrames + activeFrames && frame < entranceFrames + activeFrames + bufferFrames;

  const timerFillColor = isUrgent ? athleticDarkTokens.timer.urgentFill : athleticDarkTokens.timer.fill;
  const questionLabel = `Question ${index + 1} of ${total}`;
  const questionLength = question.questionText.length;
  const questionFontSize =
    questionLength > 120 ? 56 : questionLength > 90 ? 64 : questionLength > 60 ? 74 : 86;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "stretch",
        padding: "0 110px",
        color: athleticDarkTokens.text.primary,
      }}
    >
      <Img
        src={staticFile("video/grain.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.08,
          mixBlendMode: "multiply",
        }}
      />
      <div
        style={{
          position: "relative",
          opacity: cardOpacity,
          transform: `translateY(${cardTranslateY}px)`,
          borderRadius: 24,
          border: `1px solid ${athleticDarkTokens.card.border}`,
          background: athleticDarkTokens.card.fill,
          boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
          padding: "52px 56px 44px",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: 3,
            width: `${((index + 1) / total) * 100}%`,
            backgroundColor: athleticDarkTokens.timer.fill,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 40,
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: athleticTypography.title,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: athleticDarkTokens.text.secondary,
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            {questionLabel}
          </div>
          <div
            style={{
              minWidth: 178,
              textAlign: "right",
              fontFamily: athleticTypography.title,
              fontWeight: 800,
              fontSize: 74,
              color: timerFillColor,
              letterSpacing: "-0.03em",
              lineHeight: 0.9,
            }}
          >
            {String(countdownSeconds).padStart(2, "0")}
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            height: 10,
            borderRadius: 999,
            background: athleticDarkTokens.timer.track,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(1 - timerProgress) * 100}%`,
              background: timerFillColor,
              transition: "none",
              boxShadow: isUrgent ? "0 0 18px rgba(251,113,133,0.65)" : "0 0 18px rgba(52,211,153,0.55)",
            }}
          />
        </div>

        <h2
          style={{
            margin: "38px 0 0",
            fontFamily: athleticTypography.title,
            fontSize: questionFontSize,
            lineHeight: 1.05,
            letterSpacing: "-0.015em",
            textTransform: "uppercase",
            fontWeight: 800,
            textWrap: "balance",
            maxHeight: 380,
            overflow: "hidden",
            maxWidth: 1320,
          }}
        >
          {question.questionText}
        </h2>

        <div
          style={{
            marginTop: 24,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            maxWidth: 1320,
          }}
        >
          {question.options.slice(0, 4).map((option, optionIndex) => {
            const isCorrect = optionIndex === question.correctAnswerIndex;
            return (
              <div
                key={`${question.id}-option-${optionIndex}`}
                style={{
                  border: `1px solid ${isRevealPhase && isCorrect ? athleticDarkTokens.timer.fill : athleticDarkTokens.card.border}`,
                  background: isRevealPhase && isCorrect ? "rgba(15,118,110,0.12)" : "#FFFFFF",
                  borderRadius: 12,
                  padding: "12px 14px",
                  minHeight: 64,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    border: `1px solid ${athleticDarkTokens.card.elevatedBorder}`,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: athleticTypography.title,
                    fontWeight: 700,
                    fontSize: 16,
                    color: athleticDarkTokens.text.secondary,
                    flexShrink: 0,
                  }}
                >
                  {String.fromCharCode(65 + optionIndex)}
                </div>
                <div
                  style={{
                    fontFamily: athleticTypography.body,
                    fontWeight: 700,
                    fontSize: 28,
                    color: isRevealPhase && isCorrect ? athleticDarkTokens.timer.fill : athleticDarkTokens.text.primary,
                    lineHeight: 1.2,
                  }}
                >
                  {option}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 20,
            color: athleticDarkTokens.text.muted,
            fontFamily: athleticTypography.body,
            fontWeight: 700,
            fontSize: 20,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
          }}
        >
          {isRevealPhase
            ? `Answer: ${String.fromCharCode(65 + question.correctAnswerIndex)}`
            : "Think fast. Pick your answer before timer ends."}
        </div>

        {isBufferSection ? (
          <div
            style={{
              marginTop: 32,
              display: "inline-flex",
              padding: "10px 18px",
              borderRadius: 999,
              border: `1px solid ${athleticDarkTokens.card.elevatedBorder}`,
              fontFamily: athleticTypography.title,
              textTransform: "uppercase",
              letterSpacing: "0.19em",
              fontSize: 20,
              color: athleticDarkTokens.text.secondary,
            }}
          >
            Next question…
          </div>
        ) : null}
      </div>

      {Array.from({ length: activeSeconds }).map((_, secondIndex) => (
        <Sequence
          key={`tick-${question.id}-${secondIndex}`}
          from={entranceFrames + secondIndex * fps}
          durationInFrames={Math.max(1, Math.floor(0.12 * fps))}
          premountFor={fps}
        >
          <Audio src={staticFile("video/sfx/tick-soft.wav")} />
        </Sequence>
      ))}

      <Sequence
        from={entranceFrames + activeFrames}
        durationInFrames={Math.max(1, Math.floor(0.35 * fps))}
        premountFor={fps}
      >
        <Audio src={staticFile("video/sfx/transition-stinger.wav")} />
      </Sequence>

      {showAnswerReveal ? (
        <Sequence
          from={entranceFrames + activeFrames}
          durationInFrames={Math.max(1, Math.floor(0.2 * fps))}
          premountFor={fps}
        >
          <Audio src={staticFile("video/sfx/answer-reveal.wav")} />
        </Sequence>
      ) : null}

      {question.voiceoverSrc ? (
        <Sequence
          from={entranceFrames}
          durationInFrames={activeFrames}
          premountFor={fps}
        >
          <Audio src={staticFile(question.voiceoverSrc.replace(/^\//, ""))} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
