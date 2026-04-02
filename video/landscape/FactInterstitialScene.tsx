import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from "remotion";
import type { LandscapeTheme } from "./themes";
import { landscapeBodyFont, landscapeHeadlineFont } from "./themes";

const FACT_BANK: Record<string, string[]> = {
  football: [
    "The World Cup trophy is made of 18-carat gold and weighs over 6 kilograms.",
    "A standard football match features over 1,000 player actions from elite midfielders.",
    "Penalty success rates in major tournaments typically stay near 75%.",
  ],
  basketball: [
    "NBA players can cover over 2.5 miles in a high-tempo game.",
    "Corner threes are shorter than above-the-break threes by about two feet.",
    "Teams average around 100 possessions in modern fast-paced games.",
  ],
  cricket: [
    "A red cricket ball is hand-stitched with a pronounced seam to assist swing and seam movement.",
    "Test matches can include over 500 overs across five days.",
    "Elite fast bowlers can exceed 145 km/h while maintaining line and length.",
  ],
  mixed: [
    "Elite athletes often rely on reaction windows under 250 milliseconds during live play.",
    "Pressure moments are remembered most when pacing and reveal timing are controlled.",
    "Broadcast trivia shows improve retention by alternating question intensity with short resets.",
  ],
};

const resolveSportKey = (sport: string | null) => {
  const text = (sport ?? "").toLowerCase();
  if (text.includes("football") || text.includes("soccer")) return "football";
  if (text.includes("basket")) return "basketball";
  if (text.includes("cricket")) return "cricket";
  return "mixed";
};

export const getFactLine = (sport: string | null, index: number) => {
  const key = resolveSportKey(sport);
  const list = FACT_BANK[key] ?? FACT_BANK.mixed;
  return list[index % list.length];
};

type FactInterstitialSceneProps = {
  fps: number;
  fact: string;
  sectionIndex: number;
  theme: LandscapeTheme;
};

export const FactInterstitialScene: React.FC<FactInterstitialSceneProps> = ({ fps, fact, sectionIndex, theme }) => {
  const frame = useCurrentFrame();
  const reveal = spring({ frame, fps, config: { damping: 170 } });
  const lineWidth = interpolate(frame, [0, fps * 1.2], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", color: theme.text.primary }}>
      <div
        style={{
          width: 1320,
          borderRadius: 26,
          background: theme.surfaces.softPanel,
          border: `1px solid ${theme.surfaces.panelBorder}`,
          padding: "34px 46px",
          opacity: reveal,
          transform: `translateY(${interpolate(reveal, [0, 1], [26, 0])}px)`,
          boxShadow: "0 18px 38px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            fontFamily: landscapeBodyFont,
            color: theme.text.accent,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          Stat Timeout | Round {sectionIndex + 1}
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: landscapeHeadlineFont,
            textTransform: "uppercase",
            fontSize: 72,
            lineHeight: 0.9,
            letterSpacing: "-0.01em",
          }}
        >
          Did you know?
        </div>
        <p
          style={{
            margin: "16px 0 0",
            fontFamily: landscapeBodyFont,
            color: theme.text.secondary,
            fontSize: 34,
            lineHeight: 1.28,
            fontWeight: 650,
            maxWidth: 1170,
            textWrap: "pretty",
          }}
        >
          {fact}
        </p>
        <div
          style={{
            marginTop: 22,
            height: 4,
            borderRadius: 999,
            overflow: "hidden",
            background: theme.timer.track,
          }}
        >
          <div style={{ width: `${lineWidth}%`, height: "100%", background: theme.text.accent }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
