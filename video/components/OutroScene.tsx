import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { athleticDarkTokens, athleticTypography } from "../style-tokens";

type OutroSceneProps = {
  fps: number;
  ctaUrl: string;
  quizTitle: string;
};

export const OutroScene: React.FC<OutroSceneProps> = ({ fps, ctaUrl, quizTitle }) => {
  const frame = useCurrentFrame();
  const reveal = spring({
    frame,
    fps,
    config: {
      damping: 200,
    },
  });

  const opacity = interpolate(reveal, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        color: athleticDarkTokens.text.primary,
      }}
    >
      <div style={{ opacity, maxWidth: 1400, padding: "0 80px" }}>
        <h2
          style={{
            margin: 0,
            fontFamily: athleticTypography.title,
            fontSize: 98,
            lineHeight: 0.9,
            letterSpacing: "-0.015em",
            textTransform: "uppercase",
          }}
        >
          Play the full quiz
        </h2>
        <p
          style={{
            margin: "24px 0 0",
            fontFamily: athleticTypography.body,
            fontSize: 34,
            color: athleticDarkTokens.text.secondary,
            fontWeight: 700,
          }}
        >
          {quizTitle}
        </p>
        <div
          style={{
            marginTop: 28,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px 30px",
            borderRadius: 16,
            border: `1px solid ${athleticDarkTokens.card.elevatedBorder}`,
            background: "rgba(255,255,255,0.04)",
            fontFamily: athleticTypography.body,
            color: athleticDarkTokens.text.accent,
            fontWeight: 700,
            fontSize: 29,
            maxWidth: "100%",
            textWrap: "pretty",
          }}
        >
          {ctaUrl}
        </div>
      </div>
    </AbsoluteFill>
  );
};

