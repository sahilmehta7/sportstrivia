import React from "react";
import { AbsoluteFill, Img, spring, useCurrentFrame } from "remotion";
import qrcode from "qrcode-generator";
import type { ShortsTheme } from "./themes";
const MODERN_SANS = "'Plus Jakarta Sans', 'Manrope', 'Inter', 'Segoe UI', sans-serif";

type ShortsOutroSceneProps = {
  fps: number;
  ctaUrl: string;
  quizTitle: string;
  theme: ShortsTheme;
};

export const ShortsOutroScene: React.FC<ShortsOutroSceneProps> = ({ fps, ctaUrl, quizTitle, theme }) => {
  const frame = useCurrentFrame();
  const reveal = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 110, mass: 0.95 },
  });
  const glow = 0.75 + 0.25 * Math.sin(frame / 14);
  const qrUrl = React.useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(ctaUrl);
    qr.make();
    return qr.createDataURL(16, 0);
  }, [ctaUrl]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        color: theme.text.primary,
        padding: "0 54px",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 760,
          height: 760,
          borderRadius: 9999,
          background: `radial-gradient(circle, ${theme.background.glowA} 0%, transparent 74%)`,
          opacity: glow,
        }}
      />
      <div
        style={{
          width: "100%",
          borderRadius: 30,
          border: `1px solid ${theme.card.borderStrong}`,
          background: "rgba(0,0,0,0.38)",
          backdropFilter: "blur(10px)",
          boxShadow: theme.card.shadow,
          padding: "34px 30px",
          transform: `translateY(${(1 - reveal) * 34}px) scale(${0.98 + reveal * 0.02})`,
          opacity: reveal,
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 28,
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: 280,
            height: 280,
            borderRadius: 24,
            border: `1px solid ${theme.card.border}`,
            background: "#FFFFFF",
            padding: 18,
          }}
        >
          <Img src={qrUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>
        <div>
          <div
            style={{
              fontFamily: MODERN_SANS,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              fontWeight: 700,
              color: theme.text.secondary,
              fontSize: 20,
            }}
          >
            Full Quiz Link
          </div>
          <h2
            style={{
              margin: "12px 0 0 0",
              fontFamily: MODERN_SANS,
              fontSize: 94,
              lineHeight: 0.88,
              letterSpacing: "-0.015em",
              textTransform: "uppercase",
              fontWeight: 800,
              textWrap: "balance",
            }}
          >
            Play full round
          </h2>
          <p
            style={{
              margin: "16px 0 0 0",
              fontFamily: MODERN_SANS,
              fontSize: 30,
              lineHeight: 1.15,
              color: theme.text.secondary,
              fontWeight: 700,
            }}
          >
            {quizTitle}
          </p>
          <div
            style={{
              marginTop: 18,
              display: "inline-flex",
              alignItems: "center",
              borderRadius: 999,
              border: `1px solid ${theme.card.border}`,
              padding: "10px 16px",
              fontFamily: MODERN_SANS,
              fontSize: 18,
              color: theme.text.accent,
              fontWeight: 700,
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
