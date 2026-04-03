import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame } from "remotion";
import type { LandscapeTheme } from "./themes";
import { landscapeBodyFont, landscapeHeadlineFont } from "./themes";

type TitleSequenceSceneProps = {
  fps: number;
  title: string;
  sport: string | null;
  difficulty: string;
  questionCount: number;
  coverImageUrl: string | null;
  theme: LandscapeTheme;
};

export const TitleSequenceScene: React.FC<TitleSequenceSceneProps> = ({
  fps,
  title,
  sport,
  difficulty,
  questionCount,
  coverImageUrl,
  theme,
}) => {
  const frame = useCurrentFrame();
  const reveal = spring({ frame, fps, config: { damping: 160 } });
  const lineSweep = interpolate(frame, [0, fps * 2.2], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 110px", color: theme.text.primary }}>
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
              opacity: 0.23,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(120deg, rgba(5,10,16,0.84) 0%, rgba(5,10,16,0.58) 40%, rgba(5,10,16,0.88) 100%)",
            }}
          />
        </>
      ) : null}
      <div
        style={{
          maxWidth: 1360,
          opacity: reveal,
          transform: `translateY(${interpolate(reveal, [0, 1], [30, 0])}px)`,
        }}
      >
        <div
          style={{
            fontFamily: landscapeBodyFont,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontWeight: 700,
            color: theme.text.secondary,
            fontSize: 22,
          }}
        >
          Long-Form Sports Quiz Episode
        </div>
        <h1
          style={{
            margin: "18px 0 0",
            fontFamily: landscapeHeadlineFont,
            textTransform: "uppercase",
            fontSize: 132,
            lineHeight: 0.86,
            letterSpacing: "-0.02em",
            textWrap: "balance",
          }}
        >
          {title}
        </h1>
        <div
          style={{
            marginTop: 22,
            width: "100%",
            maxWidth: 940,
            height: 5,
            borderRadius: 999,
            overflow: "hidden",
            background: theme.timer.track,
          }}
        >
          <div
            style={{
              width: `${lineSweep}%`,
              height: "100%",
              background: theme.text.accent,
              boxShadow: `0 0 16px ${theme.text.accent}`,
            }}
          />
        </div>
        <p
          style={{
            margin: "20px 0 0",
            fontFamily: landscapeBodyFont,
            fontSize: 34,
            lineHeight: 1.25,
            color: theme.text.secondary,
            fontWeight: 650,
          }}
        >
          {sport ?? "Mixed Sports"} | {difficulty} | {questionCount} questions
        </p>
      </div>
    </AbsoluteFill>
  );
};
