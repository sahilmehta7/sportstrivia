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
import { getQuestionActiveFramesForSeconds, getQuestionBufferFrames, getQuestionEntranceFrames } from "../timing";
import type { QuizVideoQuestion } from "../types";
import type { ShortsTheme } from "./themes";

const TICK_SFX_COUNTDOWN_WINDOW_SECONDS = 5;
const formatOptionText = (value: string) => value.trim().toUpperCase();

type ShortsQuestionSceneProps = {
  fps: number;
  question: QuizVideoQuestion;
  index: number;
  total: number;
  showAnswerReveal: boolean;
  theme: ShortsTheme;
};

export const ShortsQuestionScene: React.FC<ShortsQuestionSceneProps> = ({
  fps,
  question,
  index,
  total,
  showAnswerReveal,
  theme,
}) => {
  const frame = useCurrentFrame();
  const entranceFrames = getQuestionEntranceFrames(fps);
  const activeFrames = getQuestionActiveFramesForSeconds(question.timeLimitSeconds, fps);
  const bufferFrames = getQuestionBufferFrames(fps);
  const timerFrame = Math.max(frame - entranceFrames, 0);
  const elapsedSeconds = Math.floor(timerFrame / fps);
  const activeSeconds = Math.max(1, question.timeLimitSeconds);
  const countdownSeconds = Math.max(0, activeSeconds - elapsedSeconds);
  const timerProgress = Math.min(timerFrame / activeFrames, 1);
  const revealFrame = Math.max(0, frame - (entranceFrames + activeFrames));
  const revealProgress = spring({
    frame: revealFrame,
    fps,
    config: { damping: 16, stiffness: 140, mass: 0.8 },
  });

  const sceneIntro = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 115, mass: 0.95 },
  });

  const questionTextLength = question.questionText.length;
  const questionSize =
    questionTextLength > 160 ? 46 : questionTextLength > 130 ? 52 : questionTextLength > 95 ? 58 : 64;
  const isExtraLongQuestion = questionTextLength > 150;
  const questionRows = question.options.slice(0, 4);
  const isRevealPhase = showAnswerReveal && timerFrame >= activeFrames;
  const isBufferSection = frame >= entranceFrames + activeFrames && frame < entranceFrames + activeFrames + bufferFrames;
  const urgencyLevel =
    countdownSeconds <= 2 ? "danger" : countdownSeconds <= 5 ? "warning" : "safe";
  const timerColor = theme.timer[urgencyLevel];
  const tensionPulse = 1 + Math.sin(frame / 4.4) * (urgencyLevel === "danger" ? 0.018 : 0.006);
  const pushIn = interpolate(timerProgress, [0, 1], [1.0, 1.04]);
  const countdownBlink =
    urgencyLevel === "danger" ? 0.68 + Math.max(0, Math.sin(frame * 0.55)) * 0.32 : 1;

  return (
    <AbsoluteFill
      style={{
        color: theme.text.primary,
        padding: "40px 44px 38px",
        transform: `scale(${pushIn})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: urgencyLevel === "danger" ? 0.35 : 0.16,
          background:
            urgencyLevel === "danger"
              ? "radial-gradient(circle at 50% 22%, rgba(244,63,94,0.42), transparent 54%)"
              : "radial-gradient(circle at 50% 22%, rgba(34,211,238,0.2), transparent 52%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          marginBottom: 22,
          opacity: sceneIntro,
          transform: `translateY(${(1 - sceneIntro) * -18}px)`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            borderRadius: 999,
            padding: "9px 14px 8px",
            border: `1px solid ${theme.card.border}`,
            background: "rgba(0,0,0,0.34)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              width: 9,
              height: 9,
              borderRadius: 999,
              background: timerColor,
              boxShadow: `0 0 14px ${timerColor}`,
            }}
          />
          <span
            style={{
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
              fontSize: 19,
              textTransform: "uppercase",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: theme.text.secondary,
            }}
          >
            Live Quiz
          </span>
        </div>
        <div
          style={{
            fontFamily: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
            fontWeight: 700,
            letterSpacing: "0.14em",
            fontSize: 24,
            color: theme.text.secondary,
            textTransform: "uppercase",
          }}
        >
          Q{index + 1}/{total}
        </div>
      </div>

      <div
        style={{
          position: "relative",
          borderRadius: 30,
          border: `1px solid ${theme.card.border}`,
          boxShadow: theme.card.shadow,
          background: theme.card.fill,
          padding: "28px 28px 24px",
          overflow: "hidden",
          transform: `translateY(${(1 - sceneIntro) * 28}px) scale(${0.98 + sceneIntro * 0.02})`,
          opacity: sceneIntro,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: theme.card.accentLine,
            transform: `scaleX(${0.3 + timerProgress * 0.7})`,
            transformOrigin: "left center",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div style={{ maxWidth: 690 }}>
            <div
              style={{
                fontFamily: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.17em",
                color: theme.text.secondary,
                fontWeight: 700,
                fontSize: 20,
                marginBottom: 10,
              }}
            >
              Who has this one?
            </div>
            <h2
              style={{
                margin: 0,
                fontFamily: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
                fontSize: questionSize,
                lineHeight: 0.95,
                letterSpacing: "-0.015em",
                textTransform: "uppercase",
                textWrap: "balance",
                fontWeight: 800,
                maxHeight: 280,
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 5,
                WebkitBoxOrient: "vertical",
              }}
            >
              {question.questionText}
            </h2>
          </div>
          <div
            style={{
              width: 190,
              height: 190,
              borderRadius: 9999,
              border: `2px solid ${theme.card.borderStrong}`,
              background: "rgba(0,0,0,0.34)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 0 10px ${theme.timer.track}`,
              transform: `scale(${tensionPulse})`,
            }}
          >
            <div
              style={{
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                fontSize: 16,
                textTransform: "uppercase",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: theme.text.muted,
              }}
            >
              Time
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
                fontSize: 92,
                lineHeight: 0.85,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                color: timerColor,
                opacity: countdownBlink,
              }}
            >
              {String(countdownSeconds).padStart(2, "0")}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 16,
            height: 10,
            width: "100%",
            borderRadius: 9999,
            overflow: "hidden",
            background: theme.timer.track,
          }}
        >
          <div
            style={{
              width: `${(1 - timerProgress) * 100}%`,
              height: "100%",
              background: timerColor,
              boxShadow: `0 0 18px ${timerColor}`,
            }}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: isExtraLongQuestion ? 6 : 8,
          flex: 1,
        }}
      >
        {questionRows.map((option, optionIndex) => {
          const isCorrect = optionIndex === question.correctAnswerIndex;
          const optionIn = spring({
            frame: Math.max(0, frame - (8 + optionIndex * 4)),
            fps,
            config: { damping: 18, stiffness: 120, mass: 0.9 },
          });
          const revealBoost = isRevealPhase && isCorrect ? revealProgress : 0;
          const optionBg = isRevealPhase && isCorrect ? theme.answer.correctBg : theme.answer.idleBg;
          const optionBorder = isRevealPhase && isCorrect ? theme.answer.correctBorder : theme.answer.idleBorder;

          return (
            <div
              key={`${question.id}-shorts-option-${optionIndex}`}
              style={{
                borderRadius: 20,
                border: `1px solid ${optionBorder}`,
                background: optionBg,
                minHeight: isExtraLongQuestion ? 74 : 82,
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: isExtraLongQuestion ? "10px 16px" : "12px 18px",
                transform: `translateY(${(1 - optionIn) * 26}px) scale(${0.98 + optionIn * 0.02 + revealBoost * 0.02})`,
                opacity: Math.min(1, optionIn + 0.05),
                boxShadow: isRevealPhase && isCorrect ? theme.answer.pulseGlow : undefined,
              }}
            >
              <div
                style={{
                  width: isExtraLongQuestion ? 36 : 40,
                  height: isExtraLongQuestion ? 36 : 40,
                  borderRadius: 9999,
                  border: `1px solid ${theme.card.borderStrong}`,
                  background: "rgba(0,0,0,0.34)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
                  fontSize: isExtraLongQuestion ? 21 : 23,
                  letterSpacing: "0.03em",
                  fontWeight: 800,
                  color: theme.text.secondary,
                }}
              >
                {String.fromCharCode(65 + optionIndex)}
              </div>
              <div
                style={{
                  fontFamily: "'Inter', 'Segoe UI', sans-serif",
                  fontSize: isExtraLongQuestion ? 31 : 34,
                  lineHeight: 1.05,
                  fontWeight: 800,
                  letterSpacing: "-0.015em",
                  textTransform: "uppercase",
                  color: theme.text.primary,
                }}
              >
                {formatOptionText(option)}
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 12,
          minHeight: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          borderTop: `1px solid ${theme.card.border}`,
          paddingTop: 12,
        }}
      >
        <div
          style={{
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            fontWeight: 700,
            fontSize: 23,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: isRevealPhase ? theme.text.accent : theme.text.secondary,
          }}
        >
          {isRevealPhase
            ? `Answer: ${String.fromCharCode(65 + question.correctAnswerIndex)}`
            : urgencyLevel === "danger"
              ? "No pressure. No mercy. Pick now."
              : "Lock your choice before zero."}
        </div>
        {isBufferSection ? (
          <div
            style={{
              fontFamily: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
              color: theme.text.primary,
              borderRadius: 999,
              border: `1px solid ${theme.card.borderStrong}`,
              background: "rgba(0,0,0,0.34)",
              padding: "8px 16px",
            }}
          >
            Next
          </div>
        ) : null}
      </div>

      {Array.from({ length: Math.min(activeSeconds, TICK_SFX_COUNTDOWN_WINDOW_SECONDS) }).map((_, tickIndex) => {
        const secondIndex = Math.max(0, activeSeconds - TICK_SFX_COUNTDOWN_WINDOW_SECONDS) + tickIndex;
        return (
          <Sequence
            key={`shorts-tick-${question.id}-${secondIndex}`}
            from={entranceFrames + secondIndex * fps}
            durationInFrames={Math.max(1, Math.floor(0.12 * fps))}
            premountFor={fps}
          >
            <Audio src={staticFile("video/sfx/tick-soft.wav")} />
          </Sequence>
        );
      })}

      <Sequence from={entranceFrames + activeFrames} durationInFrames={Math.max(1, Math.floor(0.35 * fps))} premountFor={fps}>
        <Audio src={staticFile("video/sfx/transition-stinger.wav")} />
      </Sequence>

      {showAnswerReveal ? (
        <Sequence from={entranceFrames + activeFrames} durationInFrames={Math.max(1, Math.floor(0.2 * fps))} premountFor={fps}>
          <Audio src={staticFile("video/sfx/answer-reveal.wav")} />
        </Sequence>
      ) : null}

      {question.voiceoverSrc ? (
        <Sequence from={entranceFrames} durationInFrames={activeFrames} premountFor={fps}>
          <Audio src={staticFile(question.voiceoverSrc.replace(/^\//, ""))} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
