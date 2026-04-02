import React from "react";
import { Img, staticFile } from "remotion";
import type { LandscapeTheme } from "./themes";
import { landscapeBodyFont, landscapeHeadlineFont } from "./themes";

type BrandBugProps = {
  theme: LandscapeTheme;
  episodeLabel: string;
  sport: string | null;
};

export const BrandBug: React.FC<BrandBugProps> = ({ theme, episodeLabel, sport }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 26,
        left: 26,
        display: "flex",
        alignItems: "center",
        gap: 14,
        zIndex: 30,
      }}
    >
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: 18,
          background: theme.surfaces.panel,
          border: `1px solid ${theme.surfaces.panelBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 14px 26px rgba(0,0,0,0.24)",
        }}
      >
        <Img src={staticFile("logo-dark.png")} style={{ width: 46, height: 46, objectFit: "contain" }} />
      </div>
      <div>
        <div
          style={{
            fontFamily: landscapeHeadlineFont,
            fontSize: 28,
            lineHeight: 0.9,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: theme.text.primary,
            fontWeight: 800,
          }}
        >
          SportsTrivia
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: landscapeBodyFont,
            fontSize: 15,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: theme.text.muted,
            fontWeight: 700,
          }}
        >
          {episodeLabel} {sport ? `- ${sport}` : ""}
        </div>
      </div>
    </div>
  );
};
