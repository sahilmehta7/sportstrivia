import { CalculateMetadataFunction } from "remotion";
import { VIDEO_HEIGHT, VIDEO_SHORTS_HEIGHT, VIDEO_SHORTS_WIDTH, VIDEO_WIDTH } from "./constants";
import { getLandscapeVideoDurationInFrames } from "./landscape/episode";
import { getVideoDurationInFrames } from "./timing";
import type { QuizYoutubeLandscapeProps } from "./types";

const safeOutName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getDefaultOutName = (props: QuizYoutubeLandscapeProps) => {
  const themeSuffix = props.videoFormat === "shorts" ? `-${props.themeVariant}` : "";
  return `${safeOutName(props.quiz.slug || props.quiz.title)}-youtube-${props.videoFormat}${themeSuffix}.mp4`;
};

export const calculateCompositionMetadata: CalculateMetadataFunction<QuizYoutubeLandscapeProps> = async ({
  props,
}) => {
  const durationInFrames =
    props.videoFormat === "landscape"
      ? getLandscapeVideoDurationInFrames(props.questions, props.fps, props.showAnswerReveal)
      : getVideoDurationInFrames(
          props.questions.map((question) => question.timeLimitSeconds),
          props.fps,
          { includeCover: false }
        );

  return {
    durationInFrames,
    width: props.videoFormat === "shorts" ? VIDEO_SHORTS_WIDTH : VIDEO_WIDTH,
    height: props.videoFormat === "shorts" ? VIDEO_SHORTS_HEIGHT : VIDEO_HEIGHT,
    defaultOutName: getDefaultOutName(props),
  };
};
