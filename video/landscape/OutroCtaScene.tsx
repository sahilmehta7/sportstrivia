import React from "react";
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame } from "remotion";
import qrcode from "qrcode-generator";
import type { LandscapeTheme } from "./themes";
import { landscapeBodyFont, landscapeHeadlineFont } from "./themes";

type OutroCtaSceneProps = {
  fps: number;
  quizTitle: string;
  ctaUrl: string;
  totalQuestions: number;
  theme: LandscapeTheme;
};

export const OutroCtaScene: React.FC<OutroCtaSceneProps> = ({ fps, quizTitle, ctaUrl, totalQuestions, theme }) => {
  const frame = useCurrentFrame();
  const reveal = spring({ frame, fps, config: { damping: 160 } });
  const qrDataUrl = React.useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(ctaUrl);
    qr.make();
    return qr.createDataURL(14, 0);
  }, [ctaUrl]);

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", color: theme.text.primary }}>
      <div
        style={{
          width: 1420,
          borderRadius: 32,
          border: `1px solid ${theme.surfaces.panelBorder}`,
          background: theme.surfaces.panel,
          display: "grid",
          gridTemplateColumns: "270px 1fr",
          gap: 32,
          alignItems: "center",
          padding: "40px 42px",
          boxShadow: "0 24px 52px rgba(0,0,0,0.35)",
          opacity: reveal,
          transform: `translateY(${interpolate(reveal, [0, 1], [26, 0])}px)`,
        }}
      >
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: 22,
            background: "#FFFFFF",
            padding: 16,
            border: `1px solid ${theme.surfaces.panelBorder}`,
            boxShadow: "0 10px 24px rgba(0,0,0,0.2)",
          }}
        >
          <Img src={qrDataUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </div>

        <div>
          <div
            style={{
              fontFamily: landscapeBodyFont,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontWeight: 700,
              fontSize: 18,
              color: theme.text.secondary,
            }}
          >
            Episode Complete
          </div>
          <h2
            style={{
              margin: "12px 0 0",
              fontFamily: landscapeHeadlineFont,
              textTransform: "uppercase",
              fontSize: 90,
              lineHeight: 0.86,
              letterSpacing: "-0.015em",
            }}
          >
            Want the full score card?
          </h2>
          <p
            style={{
              margin: "18px 0 0",
              fontFamily: landscapeBodyFont,
              fontSize: 30,
              lineHeight: 1.24,
              color: theme.text.secondary,
              fontWeight: 650,
            }}
          >
            Play {quizTitle} on SportsTrivia. {totalQuestions} questions, instant results, and fresh themed episodes.
          </p>
          <div
            style={{
              marginTop: 22,
              display: "inline-flex",
              borderRadius: 14,
              border: `1px solid ${theme.surfaces.panelBorder}`,
              padding: "12px 18px",
              fontFamily: landscapeBodyFont,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 700,
              color: theme.text.accent,
              fontSize: 19,
              maxWidth: "100%",
            }}
          >
            {ctaUrl}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
