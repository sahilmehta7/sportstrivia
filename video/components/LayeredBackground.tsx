import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { athleticDarkTokens } from "../style-tokens";

export const LayeredBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const {
    background: { base },
  } = athleticDarkTokens;
  const driftX = interpolate(frame % 240, [0, 240], [0, 120]);
  const driftY = interpolate(frame % 360, [0, 360], [0, 180]);
  const pulse = 0.65 + 0.35 * Math.sin(frame / 22);

  return (
    <AbsoluteFill style={{ background: base, overflow: "hidden" }}>
      <Img
        src={staticFile("images/tactical-grid-hero.png")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.1,
          mixBlendMode: "multiply",
          transform: `scale(1.06) translate(${Math.round(driftX * 0.2)}px, ${Math.round(driftY * 0.12)}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(140deg, rgba(220,252,255,0.8) 0%, rgba(191,219,254,0.65) 36%, rgba(240,249,255,0.84) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -180,
          background:
            "radial-gradient(circle at 12% 22%, rgba(45,212,191,0.25), transparent 42%), radial-gradient(circle at 88% 14%, rgba(56,189,248,0.18), transparent 38%), radial-gradient(circle at 56% 86%, rgba(148,163,184,0.16), transparent 54%)",
          transform: `translate(${Math.round(driftX)}px, ${Math.round(driftY * 0.35)}px) scale(1.06)`,
          opacity: 0.95,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 620,
          height: 620,
          borderRadius: 9999,
          left: -160 + Math.round(driftX * 0.45),
          top: -210 + Math.round(driftY * 0.2),
          background: "radial-gradient(circle, rgba(45,212,191,0.26), rgba(45,212,191,0.02) 70%, transparent)",
          filter: "blur(2px)",
          opacity: 0.85 * pulse,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 760,
          height: 760,
          borderRadius: 9999,
          right: -280 + Math.round(driftX * 0.2),
          bottom: -360 + Math.round(driftY * 0.55),
          background: "radial-gradient(circle, rgba(125,211,252,0.22), rgba(125,211,252,0.02) 70%, transparent)",
          opacity: 0.72,
        }}
      />
    </AbsoluteFill>
  );
};
