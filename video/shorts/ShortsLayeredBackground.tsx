import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import type { ShortsTheme } from "./themes";

type ShortsLayeredBackgroundProps = {
  theme: ShortsTheme;
};

export const ShortsLayeredBackground: React.FC<ShortsLayeredBackgroundProps> = ({ theme }) => {
  const frame = useCurrentFrame();
  const driftX = interpolate(frame % 360, [0, 360], [-38, 38]);
  const driftY = interpolate(frame % 420, [0, 420], [-30, 34]);
  const pulse = 0.72 + 0.28 * Math.sin(frame / 26);
  const pulseFast = 0.8 + 0.2 * Math.sin(frame / 10);

  return (
    <AbsoluteFill
      style={{
        background: theme.background.base,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -220,
          background: theme.background.gradient,
          transform: `translate(${driftX * 0.6}px, ${driftY * 0.4}px) scale(1.08)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: -180,
          background: theme.background.grid,
          opacity: 0.82,
          transform: `translate(${-driftX * 0.45}px, ${driftY * 0.35}px) scale(1.08)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 940,
          height: 940,
          borderRadius: 9999,
          left: -350 + driftX * 0.8,
          top: -350 + driftY * 0.35,
          background: `radial-gradient(circle, ${theme.background.glowA} 0%, transparent 72%)`,
          opacity: pulse,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 880,
          height: 880,
          borderRadius: 9999,
          right: -330 - driftX * 0.65,
          top: 180 - driftY * 0.3,
          background: `radial-gradient(circle, ${theme.background.glowB} 0%, transparent 72%)`,
          opacity: 0.88,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 960,
          height: 960,
          borderRadius: 9999,
          left: 120 + driftX * 0.2,
          bottom: -520 - driftY * 0.5,
          background: `radial-gradient(circle, ${theme.background.glowC} 0%, transparent 72%)`,
          opacity: pulseFast,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: theme.background.vignette,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.0) 24%, rgba(0,0,0,0.34) 100%)",
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};
