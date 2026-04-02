import { CalculateMetadataFunction } from "remotion";
import { VIDEO_HEIGHT, VIDEO_SHORTS_HEIGHT, VIDEO_SHORTS_WIDTH, VIDEO_WIDTH } from "./constants";
import { getVideoDurationInFrames } from "./timing";
import type { QuizYoutubeLandscapeProps } from "./types";

const safeOutName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const calculateCompositionMetadata: CalculateMetadataFunction<QuizYoutubeLandscapeProps> = async ({
  props,
}) => {
  return {
    durationInFrames: getVideoDurationInFrames(
      props.questions.map((question) => question.timeLimitSeconds),
      props.fps
    ),
    width: props.videoFormat === "shorts" ? VIDEO_SHORTS_WIDTH : VIDEO_WIDTH,
    height: props.videoFormat === "shorts" ? VIDEO_SHORTS_HEIGHT : VIDEO_HEIGHT,
    defaultOutName: `${safeOutName(props.quiz.slug || props.quiz.title)}-youtube-quiz.mp4`,
  };
};
