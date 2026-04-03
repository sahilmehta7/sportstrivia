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
const SHORTS_SAFE_TOP = 172;
const SHORTS_SAFE_BOTTOM = 236;
const SHORTS_SAFE_SIDE = 40;

const PRESERVE_LOWER_PARTICLES = new Set(["de", "da", "del", "van", "von", "bin", "ibn", "ul", "al", "el"]);
const UPPERCASE_INITIALISMS = new Set([
  "ab",
  "ms",
  "odi",
  "t20",
  "ipl",
  "nba",
  "fifa",
  "uefa",
  "ufc",
  "mlb",
  "nfl",
  "psg",
  "usa",
  "uk",
  "uae",
]);

const toSegmentTitleCase = (segment: string) => {
  if (!segment) return segment;
  if (UPPERCASE_INITIALISMS.has(segment.toLowerCase())) return segment.toUpperCase();
  if (/^[A-Z0-9]{2,5}$/.test(segment)) return segment;
  return segment[0]!.toUpperCase() + segment.slice(1).toLowerCase();
};

const toWordTitleCase = (word: string) =>
  word
    .split("-")
    .map((hyphenPart) =>
      hyphenPart
        .split("'")
        .map((apostrophePart) => toSegmentTitleCase(apostrophePart))
        .join("'")
    )
    .join("-");

const toDisplayTitleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      const normalizedWord = toWordTitleCase(word);
      const lower = normalizedWord.toLowerCase();
      if (index > 0 && PRESERVE_LOWER_PARTICLES.has(lower)) return lower;
      return normalizedWord;
    })
    .join(" ");

const optionLabel = (optionIndex: number) => String.fromCharCode(65 + optionIndex);

const getQuestionTier = (length: number) => {
  if (length > 210) {
    return {
      questionSize: 33,
      lineClamp: 10,
      maxHeight: 440,
      timerSize: 126,
      timerNumberSize: 62,
      headerLabelSize: 18,
      optionMinHeight: 58,
      optionPadding: "6px 12px",
      optionFontSize: 27,
      optionGap: 4,
      optionBadgeSize: 28,
      optionBadgeFontSize: 17,
    };
  }
  if (length > 165) {
    return {
      questionSize: 37,
      lineClamp: 9,
      maxHeight: 408,
      timerSize: 136,
      timerNumberSize: 66,
      headerLabelSize: 19,
      optionMinHeight: 62,
      optionPadding: "7px 13px",
      optionFontSize: 29,
      optionGap: 5,
      optionBadgeSize: 30,
      optionBadgeFontSize: 18,
    };
  }
  if (length > 130) {
    return {
      questionSize: 41,
      lineClamp: 8,
      maxHeight: 370,
      timerSize: 148,
      timerNumberSize: 72,
      headerLabelSize: 20,
      optionMinHeight: 68,
      optionPadding: "8px 14px",
      optionFontSize: 31,
      optionGap: 6,
      optionBadgeSize: 32,
      optionBadgeFontSize: 20,
    };
  }
  return {
    questionSize: 45,
    lineClamp: 7,
    maxHeight: 336,
    timerSize: 158,
    timerNumberSize: 76,
    headerLabelSize: 20,
    optionMinHeight: 74,
    optionPadding: "9px 15px",
    optionFontSize: 33,
    optionGap: 8,
    optionBadgeSize: 34,
    optionBadgeFontSize: 20,
  };
};

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
  const questionRows = question.options.slice(0, 4);
  const isRevealPhase = showAnswerReveal && timerFrame >= activeFrames;
  const isBufferSection = frame >= entranceFrames + activeFrames && frame < entranceFrames + activeFrames + bufferFrames;
  const urgencyLevel = countdownSeconds <= 2 ? "danger" : countdownSeconds <= 5 ? "warning" : "safe";
  const timerColor = theme.timer[urgencyLevel];
  const tensionPulse = 1 + Math.sin(frame / 4.4) * (urgencyLevel === "danger" ? 0.018 : 0.006);
  const countdownBlink = urgencyLevel === "danger" ? 0.68 + Math.max(0, Math.sin(frame * 0.55)) * 0.32 : 1;
  const tier = getQuestionTier(questionTextLength);
  const points = (index + 1) * 10;
  const revealVariant = index % 2 === 0 ? "flash" : "focus";

  return (
    <AbsoluteFill
      style={{
        color: theme.text.primary,
        padding: `${SHORTS_SAFE_TOP}px ${SHORTS_SAFE_SIDE}px ${SHORTS_SAFE_BOTTOM}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
      }}
      data-testid="shorts-safe-zone"
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
          width: "100%",
          maxWidth: 1000,
          margin: "0 auto",
          opacity: sceneIntro,
          transform: `translateY(${(1 - sceneIntro) * 20}px)`,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: theme.text.secondary,
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Round 1 | Quickfire
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: `1px solid ${theme.card.border}`,
                background: "rgba(0,0,0,0.34)",
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: theme.text.secondary,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              Q {index + 1}/{total}
            </div>
            <div
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: `1px solid ${theme.card.borderStrong}`,
                background: "rgba(0,0,0,0.34)",
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                fontWeight: 800,
                fontSize: 15,
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
            position: "relative",
            borderRadius: 26,
            border: `1px solid ${theme.card.border}`,
            boxShadow: theme.card.shadow,
            background: `linear-gradient(160deg, rgba(8,14,28,0.9) 0%, rgba(8,14,28,0.8) 42%, rgba(6,11,22,0.88) 100%), ${theme.card.fill}`,
            padding: "20px 22px 16px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 34%, rgba(0,0,0,0.25) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: theme.card.accentLine,
              transform: `scaleX(${0.3 + timerProgress * 0.7})`,
              transformOrigin: "left center",
            }}
          />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              alignItems: "start",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: theme.text.secondary,
                  fontWeight: 700,
                  fontSize: tier.headerLabelSize,
                  marginBottom: 8,
                }}
              >
                Who has this one?
              </div>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
                  fontSize: tier.questionSize,
                  lineHeight: 1.03,
                  letterSpacing: "-0.015em",
                  fontWeight: 800,
                  maxHeight: tier.maxHeight,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: tier.lineClamp,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {toDisplayTitleCase(question.questionText)}
              </h2>
            </div>

            <div
              style={{
                width: tier.timerSize,
                height: tier.timerSize,
                borderRadius: 28,
                border: `2px solid ${theme.card.borderStrong}`,
                background: "linear-gradient(180deg, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.24) 100%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 0 9px ${theme.timer.track}`,
                transform: `scale(${tensionPulse})`,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontFamily: "'Inter', 'Segoe UI', sans-serif",
                  fontSize: 14,
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
                  fontSize: tier.timerNumberSize,
                  lineHeight: 0.84,
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
              marginTop: 10,
              height: 8,
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
            marginTop: 8,
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: tier.optionGap,
            gridAutoRows: "min-content",
            alignContent: "start",
          }}
          data-testid="shorts-options-grid"
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
                  borderRadius: 16,
                  border: `1px solid ${optionBorder}`,
                  background: `linear-gradient(145deg, rgba(0,0,0,0.16), rgba(255,255,255,0.02)), ${optionBg}`,
                  minHeight: tier.optionMinHeight,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: tier.optionPadding,
                  transform: `translateY(${(1 - optionIn) * 18}px) scale(${0.99 + optionIn * 0.01 + revealBoost * 0.02})`,
                  opacity: Math.min(1, optionIn + 0.05),
                  boxShadow: isRevealPhase && isCorrect ? theme.answer.pulseGlow : "0 8px 20px rgba(0,0,0,0.18)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: isRevealPhase && isCorrect ? timerColor : "rgba(255,255,255,0.16)",
                  }}
                />
                <div
                  style={{
                    width: tier.optionBadgeSize,
                    height: tier.optionBadgeSize,
                    borderRadius: 9999,
                    border: `1px solid ${theme.card.borderStrong}`,
                    background: "rgba(0,0,0,0.34)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontFamily: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
                    fontSize: tier.optionBadgeFontSize,
                    letterSpacing: "0.03em",
                    fontWeight: 800,
                    color: theme.text.secondary,
                  }}
                >
                  {optionLabel(optionIndex)}
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', 'Segoe UI', sans-serif",
                    fontSize: tier.optionFontSize,
                    lineHeight: 1.02,
                    fontWeight: 800,
                    letterSpacing: "-0.015em",
                    color: theme.text.primary,
                  }}
                >
                  {toDisplayTitleCase(option)}
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 8,
            minHeight: 54,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            borderTop: `1px solid ${theme.card.border}`,
            paddingTop: 10,
          }}
        >
          <div
            style={{
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
              fontWeight: 700,
              fontSize: 19,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              color: isRevealPhase ? theme.text.accent : theme.text.secondary,
            }}
          >
            {isRevealPhase
              ? `Answer: ${optionLabel(question.correctAnswerIndex)}`
              : urgencyLevel === "danger"
                ? "No Pressure. No Mercy. Pick Now."
                : "Lock Your Choice Before Zero."}
          </div>
          {isBufferSection ? (
            <div
              style={{
                fontFamily: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
                fontWeight: 700,
                fontSize: 24,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: theme.text.primary,
                borderRadius: 999,
                border: `1px solid ${theme.card.borderStrong}`,
                background: "rgba(0,0,0,0.34)",
                padding: "6px 14px",
              }}
            >
              Next
            </div>
          ) : null}
        </div>

        {isRevealPhase ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -90,
              borderRadius: 18,
              border: `1px solid ${theme.card.borderStrong}`,
              background:
                revealVariant === "flash"
                  ? "linear-gradient(120deg, rgba(20,40,60,0.82) 0%, rgba(40,95,76,0.84) 100%)"
                  : "linear-gradient(120deg, rgba(14,22,44,0.82) 0%, rgba(23,66,96,0.84) 100%)",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: revealProgress,
              transform: `translateY(${interpolate(revealProgress, [0, 1], [14, 0])}px)`,
              boxShadow: "0 14px 28px rgba(0,0,0,0.28)",
            }}
          >
            <div
              style={{
                fontFamily: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
                textTransform: "uppercase",
                fontSize: 38,
                lineHeight: 0.9,
                letterSpacing: "-0.01em",
                color: theme.text.accent,
              }}
            >
              Correct answer: {optionLabel(question.correctAnswerIndex)}
            </div>
            <div
              style={{
                fontFamily: "'Inter', 'Segoe UI', sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontWeight: 800,
                color: theme.text.secondary,
                fontSize: 12,
              }}
            >
              Great reveal pacing
            </div>
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
