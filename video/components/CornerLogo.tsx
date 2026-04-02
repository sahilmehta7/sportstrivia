import React from "react";
import { Img, staticFile } from "remotion";
import { athleticDarkTokens } from "../style-tokens";

type CornerLogoProps = {
  videoFormat: "landscape" | "shorts";
};

export const CornerLogo: React.FC<CornerLogoProps> = ({ videoFormat }) => {
  const isShorts = videoFormat === "shorts";
  return (
    <div
      style={{
        position: "absolute",
        top: isShorts ? 24 : 30,
        right: isShorts ? 22 : 30,
        width: isShorts ? 132 : 156,
        height: isShorts ? 132 : 156,
        borderRadius: isShorts ? 20 : 26,
        background: athleticDarkTokens.logo.plate,
        border: `1px solid ${athleticDarkTokens.logo.border}`,
        boxShadow: "0 16px 34px rgba(0,0,0,0.24)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 30,
      }}
    >
      <Img
        src={staticFile("logo-dark.png")}
        style={{
          width: isShorts ? 94 : 110,
          height: isShorts ? 94 : 110,
          objectFit: "contain",
          opacity: 0.97,
        }}
      />
    </div>
  );
};
