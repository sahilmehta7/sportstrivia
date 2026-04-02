import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { LandscapeTheme } from "./themes";

type StudioBackgroundProps = {
  theme: LandscapeTheme;
};

export const StudioBackground: React.FC<StudioBackgroundProps> = ({ theme }) => {
  const frame = useCurrentFrame();
  const driftX = interpolate(frame % 600, [0, 600], [-70, 70]);
  const driftY = interpolate(frame % 450, [0, 450], [-35, 55]);

  return (
    <AbsoluteFill style={{ background: theme.background.base, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: -220,
          background: `radial-gradient(circle at 18% 26%, ${theme.background.glow}, transparent 48%), radial-gradient(circle at 84% 80%, ${theme.background.glow}, transparent 45%)`,
          transform: `translate(${driftX}px, ${driftY}px) scale(1.08)`,
          opacity: 0.92,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(120deg, ${theme.background.gradientA} 0%, ${theme.background.gradientB} 64%)`,
          opacity: 0.78,
        }}
      />
      <Img
        src={staticFile("images/tactical-grid-hero.png")}
        style={{
          position: "absolute",
          inset: -80,
          width: "120%",
          height: "120%",
          objectFit: "cover",
          opacity: 0.11,
          transform: `translate(${Math.round(driftX * 0.42)}px, ${Math.round(driftY * 0.28)}px)`,
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(0,0,0,0) 0%, ${theme.background.vignette} 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};
