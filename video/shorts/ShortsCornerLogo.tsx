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
        top: 22,
        right: 22,
        width: 122,
        height: 122,
        borderRadius: 24,
        background: theme.brand.plate,
        border: `1px solid ${theme.brand.border}`,
        boxShadow: "0 18px 36px rgba(0,0,0,0.38)",
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
          width: 86,
          height: 86,
          objectFit: "contain",
          opacity: 0.98,
          filter: "brightness(1.06) contrast(1.04)",
        }}
      />
    </div>
  );
};
