import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame } from "remotion";
import { athleticTypography } from "../style-tokens";

type CoverSceneProps = {
  fps: number;
  title: string;
  coverImageUrl: string | null;
};

export const CoverScene: React.FC<CoverSceneProps> = ({ fps, title, coverImageUrl }) => {
  const frame = useCurrentFrame();
  const reveal = spring({
    frame,
    fps,
    config: {
      damping: 200,
    },
  });

  const titleOpacity = interpolate(reveal, [0, 1], [0.1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#F8FAFC" }}>
      {coverImageUrl ? (
        <Img
          src={coverImageUrl}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : null}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: coverImageUrl ? "linear-gradient(to top, rgba(11,18,32,0.75), rgba(11,18,32,0.1))" : "#F8FAFC",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 80,
          right: 80,
          bottom: 84,
          color: coverImageUrl ? "#FFFFFF" : "#0B1220",
          opacity: titleOpacity,
        }}
      >
        <div
          style={{
            fontFamily: athleticTypography.title,
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontWeight: 700,
            fontSize: 22,
            marginBottom: 16,
          }}
        >
          SportsTrivia
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: athleticTypography.title,
            textTransform: "uppercase",
            letterSpacing: "-0.012em",
            lineHeight: 0.95,
            fontWeight: 900,
            fontSize: 108,
            textWrap: "balance",
          }}
        >
          {title}
        </h1>
      </div>
    </AbsoluteFill>
  );
};
