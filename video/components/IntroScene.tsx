import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame } from "remotion";
import { athleticDarkTokens, athleticTypography } from "../style-tokens";

type IntroSceneProps = {
  fps: number;
  title: string;
  sport: string | null;
  difficulty: string;
  coverImageUrl: string | null;
  videoFormat: "landscape" | "shorts";
};

export const IntroScene: React.FC<IntroSceneProps> = ({
  fps,
  title,
  sport,
  difficulty,
  coverImageUrl,
  videoFormat,
}) => {
  const isShorts = videoFormat === "shorts";
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
        padding: isShorts ? "0 56px" : "0 120px",
        color: athleticDarkTokens.text.primary,
      }}
    >
      {isShorts && coverImageUrl ? (
        <>
          <Img
            src={coverImageUrl}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.32,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(248,250,252,0.72) 0%, rgba(248,250,252,0.92) 42%, rgba(248,250,252,0.96) 100%)",
            }}
          />
        </>
      ) : null}
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          maxWidth: isShorts ? "100%" : 1450,
          position: "relative",
        }}
      >
        <div
          style={{
            fontFamily: athleticTypography.title,
            textTransform: "uppercase",
            letterSpacing: "0.28em",
            color: athleticDarkTokens.text.secondary,
            fontSize: isShorts ? 18 : 24,
            fontWeight: 700,
            marginBottom: isShorts ? 16 : 22,
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
            fontSize: isShorts ? 76 : 112,
            margin: 0,
            textWrap: "balance",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            marginTop: isShorts ? 20 : 28,
            marginBottom: 0,
            fontFamily: athleticTypography.body,
            fontSize: isShorts ? 28 : 36,
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
