import { CalculateMetadataFunction } from "remotion";
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
    defaultOutName: `${safeOutName(props.quiz.slug || props.quiz.title)}-youtube-quiz.mp4`,
  };
};
