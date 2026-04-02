import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame } from "remotion";
import { athleticTypography } from "../style-tokens";

type CoverSceneProps = {
  fps: number;
  title: string;
  coverImageUrl: string | null;
  videoFormat: "landscape" | "shorts";
};

export const CoverScene: React.FC<CoverSceneProps> = ({ fps, title, coverImageUrl, videoFormat }) => {
  const isShorts = videoFormat === "shorts";
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
          left: isShorts ? 56 : 80,
          right: isShorts ? 56 : 80,
          bottom: isShorts ? 140 : 84,
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
            fontSize: isShorts ? 18 : 22,
            marginBottom: isShorts ? 12 : 16,
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
            fontSize: isShorts ? 78 : 108,
            textWrap: "balance",
          }}
        >
          {title}
        </h1>
      </div>
    </AbsoluteFill>
  );
};
