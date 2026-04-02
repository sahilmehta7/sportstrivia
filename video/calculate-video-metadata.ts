import { loadQuizForVideo } from "./load-quiz-for-video";
import { getVideoDurationInFrames } from "./timing";
import {
  quizVideoRenderInputSchema,
  type QuizYoutubeLandscapeProps,
  type QuizVideoRenderInputRaw,
} from "./types";

const safeOutName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const calculateVideoMetadata = async (rawInput: QuizVideoRenderInputRaw) => {
  const input = quizVideoRenderInputSchema.parse(rawInput);
  const quizData = await loadQuizForVideo(input);

  const props: QuizYoutubeLandscapeProps = {
    fps: input.fps,
    videoFormat: input.videoFormat,
    showAnswerReveal: input.showAnswerReveal,
    themeVariant: input.themeVariant,
    logoCorner: input.logoCorner,
    quiz: quizData.quiz,
    ctaUrl: quizData.ctaUrl,
    questions: quizData.questions,
  };

  const durationInFrames = getVideoDurationInFrames(
    props.questions.map((question) => question.timeLimitSeconds),
    props.fps
  );
  const defaultOutName = `${safeOutName(props.quiz.slug || props.quiz.title)}-youtube-${props.videoFormat}.mp4`;

  return {
    durationInFrames,
    props,
    defaultOutName,
    selectionSeed: quizData.selectionSeed,
  };
};
