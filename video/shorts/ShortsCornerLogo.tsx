import React from "react";
import { Img, staticFile } from "remotion";
import type { ShortsTheme } from "./themes";

type ShortsCornerLogoProps = {
  theme: ShortsTheme;
};

export const ShortsCornerLogo: React.FC<ShortsCornerLogoProps> = ({ theme }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 26,
        right: 24,
        width: 108,
        height: 108,
        borderRadius: 20,
        background: theme.brand.plate,
        border: `1px solid ${theme.brand.border}`,
        boxShadow: "0 14px 28px rgba(0,0,0,0.34)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 80,
        backdropFilter: "blur(8px)",
      }}
    >
      <Img
        src={staticFile("logo-dark.png")}
        style={{
          width: 72,
          height: 72,
          objectFit: "contain",
          opacity: 0.95,
          filter: "brightness(1.06) contrast(1.04)",
        }}
      />
    </div>
  );
};
