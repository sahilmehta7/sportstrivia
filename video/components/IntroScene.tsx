import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import { athleticDarkTokens, athleticTypography } from "../style-tokens";

type IntroSceneProps = {
  fps: number;
  title: string;
  sport: string | null;
  difficulty: string;
};

export const IntroScene: React.FC<IntroSceneProps> = ({ fps, title, sport, difficulty }) => {
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

  const translateY = interpolate(reveal, [0, 1], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        padding: "0 120px",
        color: athleticDarkTokens.text.primary,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          maxWidth: 1450,
        }}
      >
        <div
          style={{
            fontFamily: athleticTypography.title,
            textTransform: "uppercase",
            letterSpacing: "0.28em",
            color: athleticDarkTokens.text.secondary,
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 22,
          }}
        >
          SportsTrivia YouTube Challenge
        </div>
        <h1
          style={{
            fontFamily: athleticTypography.title,
            textTransform: "uppercase",
            letterSpacing: "-0.015em",
            lineHeight: 0.92,
            fontSize: 112,
            margin: 0,
            textWrap: "balance",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            marginTop: 28,
            marginBottom: 0,
            fontFamily: athleticTypography.body,
            fontSize: 36,
            fontWeight: 700,
            color: athleticDarkTokens.text.secondary,
            lineHeight: 1.25,
          }}
        >
          {sport ?? "General Sports"} • {difficulty} • Play along before the timer runs out.
        </p>
      </div>
    </AbsoluteFill>
  );
};

