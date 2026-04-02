import type { WebpackConfiguration } from "@remotion/bundler";

export const withVideoWebpackOverride = (
  current: WebpackConfiguration
): WebpackConfiguration => {
  return {
    ...current,
    target: ["web", "es2020"],
    output: {
      ...current.output,
      chunkFormat: "array-push",
    },
  };
};

