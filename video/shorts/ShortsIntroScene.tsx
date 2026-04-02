import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame } from "remotion";
import type { ShortsTheme } from "./themes";

type ShortsIntroSceneProps = {
  fps: number;
  title: string;
  sport: string | null;
  difficulty: string;
  coverImageUrl: string | null;
  theme: ShortsTheme;
};

export const ShortsIntroScene: React.FC<ShortsIntroSceneProps> = ({
  fps,
  title,
  sport,
  difficulty,
  coverImageUrl,
  theme,
}) => {
  const frame = useCurrentFrame();
  const hookPop = spring({
    frame,
    fps,
    durationInFrames: 16,
    config: { damping: 16, stiffness: 190, mass: 0.9 },
  });
  const contentRise = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.92 },
  });
  const flashOpacity = interpolate(frame, [0, 4, 11, 18], [0.8, 0.16, 0.22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleLength = title.length;
  const titleSize = titleLength > 84 ? 86 : titleLength > 56 ? 98 : 108;

  return (
    <AbsoluteFill style={{ padding: "72px 58px 72px 58px", justifyContent: "space-between", color: theme.text.primary }}>
      {coverImageUrl ? (
        <>
          <Img
            src={coverImageUrl}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.28,
              transform: `scale(${1.05 + (1 - contentRise) * 0.05})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(1,4,10,0.2), rgba(1,4,10,0.72))",
            }}
          />
        </>
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 0%, ${theme.background.glowA} 0%, transparent 48%)`,
          opacity: flashOpacity,
          mixBlendMode: "screen",
        }}
      />

      <div
        style={{
          alignSelf: "flex-start",
          transform: `scale(${0.8 + hookPop * 0.2}) translateY(${(1 - hookPop) * -22}px)`,
          transformOrigin: "left top",
          background: "rgba(0,0,0,0.34)",
          border: `1px solid ${theme.card.borderStrong}`,
          padding: "16px 22px 14px",
          borderRadius: 16,
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
            fontSize: 42,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            lineHeight: 1,
            color: theme.text.primary,
          }}
        >
          Stop Scrolling
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
            fontSize: 26,
            fontWeight: 700,
            color: theme.text.secondary,
          }}
        >
          Beat the clock in this round
        </div>
      </div>

      <div
        style={{
          transform: `translateY(${(1 - contentRise) * 40}px)`,
          opacity: contentRise,
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
            fontSize: 24,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            fontWeight: 700,
            color: theme.text.secondary,
          }}
        >
          Sports Trivia Challenge
        </div>
        <h1
          style={{
            margin: "16px 0 0 0",
            fontFamily: "'Barlow Condensed', 'Oswald', 'Arial Narrow', sans-serif",
            fontSize: titleSize,
            lineHeight: 0.88,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
            textWrap: "balance",
            maxWidth: 940,
            fontWeight: 800,
          }}
        >
          {title}
        </h1>
      </div>

      <div
        style={{
          alignSelf: "flex-end",
          display: "inline-flex",
          gap: 14,
          padding: "14px 18px",
          borderRadius: 14,
          border: `1px solid ${theme.card.border}`,
          background: "rgba(0,0,0,0.32)",
          color: theme.text.secondary,
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          fontWeight: 700,
          fontSize: 22,
          backdropFilter: "blur(8px)",
        }}
      >
        <span>{sport ?? "Mixed Sports"}</span>
        <span style={{ opacity: 0.7 }}>•</span>
        <span>{difficulty}</span>
      </div>
    </AbsoluteFill>
  );
};
