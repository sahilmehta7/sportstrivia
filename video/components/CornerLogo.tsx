import React from "react";
import { Img, staticFile } from "remotion";
import { athleticDarkTokens } from "../style-tokens";

export const CornerLogo: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        top: 36,
        right: 36,
        width: 132,
        height: 132,
        borderRadius: 24,
        background: athleticDarkTokens.logo.plate,
        border: `1px solid ${athleticDarkTokens.logo.border}`,
        boxShadow: "0 14px 28px rgba(0,0,0,0.24)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 30,
      }}
    >
      <Img
        src={staticFile("logo.png")}
        style={{
          width: 88,
          height: 88,
          objectFit: "contain",
          opacity: 0.92,
        }}
      />
    </div>
  );
};

