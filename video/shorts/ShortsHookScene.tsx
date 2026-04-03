import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame } from "remotion";
import type { ShortsTheme } from "./themes";

const MODERN_SANS = "'Plus Jakarta Sans', 'Manrope', 'Inter', 'Segoe UI', sans-serif";

const getSportToken = (sport: string | null) => {
  const normalized = (sport ?? "").toLowerCase();
  if (normalized.includes("cricket")) return { label: "Cricket Live", icon: "C", accent: "#22D3EE" };
  if (normalized.includes("football") || normalized.includes("soccer"))
    return { label: "Football Live", icon: "F", accent: "#38BDF8" };
  if (normalized.includes("basketball")) return { label: "Basketball Live", icon: "B", accent: "#F97316" };
  if (normalized.includes("tennis")) return { label: "Tennis Live", icon: "T", accent: "#34D399" };
  return { label: "Sports Live", icon: "S", accent: "#A78BFA" };
};

type ShortsHookSceneProps = {
  fps: number;
  title: string;
  sport: string | null;
  theme: ShortsTheme;
  durationInFrames: number;
};

export const ShortsHookScene: React.FC<ShortsHookSceneProps> = ({ fps, title, sport, theme, durationInFrames }) => {
  const frame = useCurrentFrame();
  const token = getSportToken(sport);
  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 190, mass: 0.85 },
    durationInFrames: Math.max(8, Math.floor(durationInFrames * 0.75)),
  });
  const streakX = interpolate(frame, [0, durationInFrames], [-320, 320], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flashOpacity = interpolate(frame, [0, 3, 7, 12], [0.78, 0.2, 0.32, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleSize = title.length > 64 ? 52 : 60;

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", pointerEvents: "none" }} data-testid="shorts-hook-scene">
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 22%, ${token.accent}55, transparent 54%)`,
          opacity: flashOpacity,
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -180,
          top: "20%",
          width: 620,
          height: 10,
          borderRadius: 999,
          background: token.accent,
          opacity: 0.72,
          transform: `translateX(${streakX}px)`,
          boxShadow: `0 0 24px ${token.accent}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -200,
          bottom: "22%",
          width: 640,
          height: 8,
          borderRadius: 999,
          background: theme.text.accent,
          opacity: 0.6,
          transform: `translateX(${-streakX * 0.8}px)`,
          boxShadow: `0 0 20px ${theme.text.accent}`,
        }}
      />

      <div
        style={{
          width: 940,
          borderRadius: 24,
          border: `1px solid ${theme.card.borderStrong}`,
          background: "rgba(4,8,20,0.5)",
          backdropFilter: "blur(8px)",
          padding: "18px 22px",
          transform: `translateY(${(1 - enter) * 22}px) scale(${0.96 + enter * 0.04})`,
          opacity: enter,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            borderRadius: 999,
            border: `1px solid ${theme.card.border}`,
            background: "rgba(0,0,0,0.35)",
            padding: "8px 12px",
            fontFamily: MODERN_SANS,
            color: theme.text.secondary,
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontSize: 16,
          }}
        >
          <span
            style={{
              width: 24,
              height: 24,
              borderRadius: 999,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: token.accent,
              color: "#04111D",
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            {token.icon}
          </span>
          {token.label}
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: MODERN_SANS,
            fontWeight: 900,
            fontSize: titleSize,
            letterSpacing: "-0.02em",
            lineHeight: 0.92,
            textTransform: "uppercase",
            color: theme.text.primary,
          }}
        >
          Live Quiz Starts Now
        </div>
      </div>

      <Sequence from={0} durationInFrames={Math.max(1, Math.floor(0.28 * fps))}>
        <Audio src={staticFile("video/sfx/transition-stinger.wav")} volume={0.6} />
      </Sequence>
      <Sequence from={Math.max(1, Math.floor(0.22 * fps))} durationInFrames={Math.max(1, Math.floor(0.12 * fps))}>
        <Audio src={staticFile("video/sfx/tick-soft.wav")} volume={0.48} />
      </Sequence>
    </AbsoluteFill>
  );
};

