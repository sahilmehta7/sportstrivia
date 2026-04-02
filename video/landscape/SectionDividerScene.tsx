import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import type { LandscapeTheme } from "./themes";
import { landscapeBodyFont, landscapeHeadlineFont } from "./themes";

type SectionDividerSceneProps = {
  fps: number;
  sectionTitle: string;
  sectionIndex: number;
  totalSections: number;
  startQuestion: number;
  endQuestion: number;
  totalQuestions: number;
  theme: LandscapeTheme;
};

export const SectionDividerScene: React.FC<SectionDividerSceneProps> = ({
  fps,
  sectionTitle,
  sectionIndex,
  totalSections,
  startQuestion,
  endQuestion,
  totalQuestions,
  theme,
}) => {
  const frame = useCurrentFrame();
  const reveal = spring({ frame, fps, config: { damping: 180 } });
  const sweep = interpolate(frame, [0, fps * 1.1], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", color: theme.text.primary }}>
      <div
        style={{
          width: 1240,
          borderRadius: 24,
          border: `1px solid ${theme.surfaces.panelBorder}`,
          background: theme.surfaces.panel,
          boxShadow: "0 26px 46px rgba(0,0,0,0.35)",
          padding: "34px 42px",
          opacity: reveal,
          transform: `translateY(${interpolate(reveal, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: landscapeBodyFont,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            fontSize: 20,
            color: theme.text.secondary,
            fontWeight: 700,
          }}
        >
          Round {sectionIndex + 1} of {totalSections}
        </div>
        <h2
          style={{
            margin: "12px 0 0",
            fontFamily: landscapeHeadlineFont,
            textTransform: "uppercase",
            fontSize: 92,
            lineHeight: 0.88,
            letterSpacing: "-0.015em",
          }}
        >
          {sectionTitle}
        </h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
          <div
            style={{
              fontFamily: landscapeBodyFont,
              fontSize: 28,
              color: theme.text.muted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontWeight: 700,
            }}
          >
            Questions {startQuestion + 1}-{endQuestion + 1} of {totalQuestions}
          </div>
          <div
            style={{
              fontFamily: landscapeBodyFont,
              fontSize: 26,
              color: theme.text.accent,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 800,
            }}
          >
            Stay locked in
          </div>
        </div>
        <div
          style={{
            marginTop: 22,
            height: 5,
            borderRadius: 999,
            overflow: "hidden",
            background: theme.timer.track,
          }}
        >
          <div style={{ width: `${sweep}%`, height: "100%", background: theme.text.accent }} />
        </div>
      </div>

      <Sequence from={0} durationInFrames={Math.max(1, Math.floor(0.25 * fps))}>
        <Audio src={staticFile("video/sfx/transition-stinger.wav")} volume={0.55} />
      </Sequence>
    </AbsoluteFill>
  );
};
