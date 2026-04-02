import React from "react";
import { Composition } from "remotion";
import { VIDEO_HEIGHT, VIDEO_WIDTH } from "./constants";
import { calculateCompositionMetadata } from "./calculate-metadata";
import { QuizYoutubeLandscape } from "./QuizYoutubeLandscape";
import { SAMPLE_QUIZ_VIDEO_PROPS } from "./sample-props";
import type { QuizYoutubeLandscapeProps } from "./types";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="QuizYoutubeLandscape"
      component={QuizYoutubeLandscape}
      durationInFrames={1}
      fps={SAMPLE_QUIZ_VIDEO_PROPS.fps}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      defaultProps={SAMPLE_QUIZ_VIDEO_PROPS satisfies QuizYoutubeLandscapeProps}
      calculateMetadata={calculateCompositionMetadata}
    />
  );
};

