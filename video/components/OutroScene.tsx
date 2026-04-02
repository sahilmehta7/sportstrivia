import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame } from "remotion";
import qrcode from "qrcode-generator";
import { athleticDarkTokens, athleticTypography } from "../style-tokens";

type OutroSceneProps = {
  fps: number;
  ctaUrl: string;
  quizTitle: string;
  videoFormat: "landscape" | "shorts";
};

export const OutroScene: React.FC<OutroSceneProps> = ({ fps, ctaUrl, quizTitle, videoFormat }) => {
  const isShorts = videoFormat === "shorts";
  const qrUrl = React.useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(ctaUrl);
    qr.make();
    return qr.createDataURL(isShorts ? 16 : 14, 0);
  }, [ctaUrl, isShorts]);
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
      <div
        style={{
          opacity,
          maxWidth: isShorts ? 920 : 1400,
          padding: isShorts ? "0 48px" : "0 80px",
          display: "flex",
          flexDirection: isShorts ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: isShorts ? 24 : 54,
        }}
      >
        <div
          style={{
            width: isShorts ? 300 : 250,
            height: isShorts ? 300 : 250,
            borderRadius: 26,
            background: "#FFFFFF",
            border: `1px solid ${athleticDarkTokens.card.border}`,
            boxShadow: "0 14px 30px rgba(0,0,0,0.12)",
            padding: isShorts ? 22 : 18,
            flexShrink: 0,
          }}
        >
          <Img
            src={qrUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
        <div>
        <h2
          style={{
            margin: 0,
            fontFamily: athleticTypography.title,
            fontSize: isShorts ? 72 : 98,
            lineHeight: 0.9,
            letterSpacing: "-0.015em",
            textTransform: "uppercase",
          }}
        >
          Play the full quiz
        </h2>
        <p
          style={{
            margin: `${isShorts ? 18 : 24}px 0 0`,
            fontFamily: athleticTypography.body,
            fontSize: isShorts ? 28 : 34,
            color: athleticDarkTokens.text.secondary,
            fontWeight: 700,
          }}
        >
          {quizTitle}
        </p>
        <div
          style={{
            marginTop: isShorts ? 22 : 28,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: isShorts ? "14px 22px" : "18px 30px",
            borderRadius: 16,
            border: `1px solid ${athleticDarkTokens.card.elevatedBorder}`,
            background: "rgba(255,255,255,0.04)",
            fontFamily: athleticTypography.body,
            color: athleticDarkTokens.text.accent,
            fontWeight: 700,
            fontSize: isShorts ? 24 : 29,
            maxWidth: "100%",
            textWrap: "pretty",
          }}
        >
          {ctaUrl}
        </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
