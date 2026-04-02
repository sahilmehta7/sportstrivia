import {
  COVER_DURATION_SECONDS,
  INTRO_DURATION_SECONDS,
  OUTRO_DURATION_SECONDS,
  QUESTION_ACTIVE_SECONDS,
  QUESTION_BUFFER_SECONDS,
  QUESTION_ENTRANCE_SECONDS,
} from "./constants";

const toFrames = (seconds: number, fps: number) => Math.round(seconds * fps);

export const getCoverFrames = (fps: number) => toFrames(COVER_DURATION_SECONDS, fps);
export const getIntroFrames = (fps: number) => toFrames(INTRO_DURATION_SECONDS, fps);
export const getQuestionEntranceFrames = (fps: number) => toFrames(QUESTION_ENTRANCE_SECONDS, fps);
export const getQuestionActiveFrames = (fps: number) => toFrames(QUESTION_ACTIVE_SECONDS, fps);
export const getQuestionActiveFramesForSeconds = (timeLimitSeconds: number, fps: number) =>
  Math.max(1, toFrames(timeLimitSeconds, fps));
export const getQuestionBufferFrames = (fps: number) => toFrames(QUESTION_BUFFER_SECONDS, fps);
export const getQuestionBlockFrames = (fps: number, timeLimitSeconds: number) =>
  getQuestionEntranceFrames(fps) + getQuestionActiveFramesForSeconds(timeLimitSeconds, fps) + getQuestionBufferFrames(fps);
export const getOutroFrames = (fps: number) => toFrames(OUTRO_DURATION_SECONDS, fps);

export const getVideoDurationInFrames = (timeLimitSecondsList: number[], fps: number) => {
  const questionFrames = timeLimitSecondsList.reduce((acc, timeLimitSeconds) => {
    return acc + getQuestionBlockFrames(fps, timeLimitSeconds);
  }, 0);

  return (
    getCoverFrames(fps) +
    getIntroFrames(fps) +
    questionFrames +
    getOutroFrames(fps)
  );
};
