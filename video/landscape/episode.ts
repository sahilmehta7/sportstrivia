import type { QuizVideoQuestion } from "../types";

export const QUESTIONS_PER_SECTION = 4;

export const LANDSCAPE_TITLE_SECONDS = 4.5;
export const LANDSCAPE_SECTION_DIVIDER_SECONDS = 1.6;
export const LANDSCAPE_QUESTION_ENTRY_SECONDS = 0.8;
export const LANDSCAPE_QUESTION_HOLD_SECONDS = 0.5;
export const LANDSCAPE_REVEAL_SECONDS = 1.8;
export const LANDSCAPE_NO_REVEAL_SECONDS = 0.45;
export const LANDSCAPE_FACT_SECONDS = 2.2;
export const LANDSCAPE_OUTRO_SECONDS = 4.2;

const toFrames = (seconds: number, fps: number) => Math.round(seconds * fps);

export const getLandscapeTitleFrames = (fps: number) => toFrames(LANDSCAPE_TITLE_SECONDS, fps);
export const getLandscapeSectionDividerFrames = (fps: number) => toFrames(LANDSCAPE_SECTION_DIVIDER_SECONDS, fps);
export const getLandscapeFactFrames = (fps: number) => toFrames(LANDSCAPE_FACT_SECONDS, fps);
export const getLandscapeOutroFrames = (fps: number) => toFrames(LANDSCAPE_OUTRO_SECONDS, fps);

export const getLandscapeQuestionFrames = (
  fps: number,
  questionTimeLimitSeconds: number,
  showAnswerReveal: boolean
) => {
  return (
    toFrames(LANDSCAPE_QUESTION_ENTRY_SECONDS, fps) +
    toFrames(Math.max(5, questionTimeLimitSeconds), fps) +
    toFrames(showAnswerReveal ? LANDSCAPE_REVEAL_SECONDS : LANDSCAPE_NO_REVEAL_SECONDS, fps) +
    toFrames(LANDSCAPE_QUESTION_HOLD_SECONDS, fps)
  );
};

export type EpisodeSection = {
  sectionIndex: number;
  title: string;
  questions: QuizVideoQuestion[];
  startQuestionIndex: number;
  endQuestionIndex: number;
};

const SECTION_TITLES = ["Opening Drive", "Momentum Shift", "Pressure Round", "Final Sprint"];

export const buildEpisodeSections = (questions: QuizVideoQuestion[]): EpisodeSection[] => {
  const sections: EpisodeSection[] = [];
  for (let start = 0; start < questions.length; start += QUESTIONS_PER_SECTION) {
    const sectionQuestions = questions.slice(start, start + QUESTIONS_PER_SECTION);
    const sectionIndex = Math.floor(start / QUESTIONS_PER_SECTION);
    sections.push({
      sectionIndex,
      title: SECTION_TITLES[sectionIndex] ?? `Round ${sectionIndex + 1}`,
      questions: sectionQuestions,
      startQuestionIndex: start,
      endQuestionIndex: start + sectionQuestions.length - 1,
    });
  }
  return sections;
};

export const getLandscapeVideoDurationInFrames = (
  questions: QuizVideoQuestion[],
  fps: number,
  showAnswerReveal: boolean
) => {
  if (questions.length === 0) {
    return getLandscapeTitleFrames(fps) + getLandscapeOutroFrames(fps);
  }

  const sections = buildEpisodeSections(questions);
  const questionFrames = questions.reduce((sum, question) => {
    return sum + getLandscapeQuestionFrames(fps, question.timeLimitSeconds, showAnswerReveal);
  }, 0);

  return (
    getLandscapeTitleFrames(fps) +
    sections.length * getLandscapeSectionDividerFrames(fps) +
    questionFrames +
    sections.length * getLandscapeFactFrames(fps) +
    getLandscapeOutroFrames(fps)
  );
};
