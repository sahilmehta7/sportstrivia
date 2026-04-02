import React from "react";
import { AbsoluteFill } from "remotion";
import { athleticDarkTokens } from "../style-tokens";

export const LayeredBackground: React.FC = () => {
  const {
    background: { base },
  } = athleticDarkTokens;
  return (
    <AbsoluteFill
      style={{
        background: base,
      }}
    />
  );
};
