import React from "react";
import { AbsoluteFill, Audio, Series, staticFile } from "remotion";
import { getIntroFrames, getOutroFrames, getQuestionBlockFrames } from "../timing";
import type { QuizYoutubeLandscapeProps } from "../types";
import { ShortsCornerLogo } from "./ShortsCornerLogo";
import { ShortsHookScene } from "./ShortsHookScene";
import { ShortsIntroScene } from "./ShortsIntroScene";
import { ShortsLayeredBackground } from "./ShortsLayeredBackground";
import { ShortsOutroScene } from "./ShortsOutroScene";
import { ShortsQuestionScene } from "./ShortsQuestionScene";
import { resolveShortsTheme } from "./themes";

type ShortsQuizExperienceProps = Pick<
  QuizYoutubeLandscapeProps,
  "fps" | "themeVariant" | "quiz" | "ctaUrl" | "questions" | "showAnswerReveal"
>;

export const SHORTS_HOOK_DEFAULTS = {
  hookEnabled: true,
  hookDurationMs: 800,
  hookStyle: "sport-aware-template" as const,
};

export const getShortsHookFrames = (fps: number) =>
  Math.max(1, Math.round((SHORTS_HOOK_DEFAULTS.hookDurationMs / 1000) * fps));

export const ShortsQuizExperience: React.FC<ShortsQuizExperienceProps> = ({
  fps,
  quiz,
  ctaUrl,
  questions,
  showAnswerReveal,
  themeVariant,
}) => {
  const hookFrames = getShortsHookFrames(fps);
  const introFrames = getIntroFrames(fps);
  const trimmedIntroFrames = Math.max(1, introFrames - Math.floor(hookFrames * 0.5));
  const outroFrames = getOutroFrames(fps);
  const theme = resolveShortsTheme(themeVariant);

  return (
    <AbsoluteFill>
      <ShortsLayeredBackground theme={theme} />
      <ShortsCornerLogo theme={theme} />
      <Audio src={staticFile("video/music/quiz-bed.mp3")} volume={0.15} loop />
      <Series>
        {SHORTS_HOOK_DEFAULTS.hookEnabled ? (
          <Series.Sequence durationInFrames={hookFrames} premountFor={fps}>
            <ShortsHookScene
              fps={fps}
              title={quiz.title}
              sport={quiz.sport}
              theme={theme}
              durationInFrames={hookFrames}
            />
          </Series.Sequence>
        ) : null}
        <Series.Sequence durationInFrames={trimmedIntroFrames} premountFor={fps}>
          <ShortsIntroScene
            fps={fps}
            title={quiz.title}
            sport={quiz.sport}
            difficulty={quiz.difficulty}
            coverImageUrl={quiz.coverImageUrl}
            theme={theme}
          />
        </Series.Sequence>
        {questions.map((question, index) => (
          <Series.Sequence
            key={question.id}
            durationInFrames={getQuestionBlockFrames(fps, question.timeLimitSeconds)}
            premountFor={fps}
          >
            <ShortsQuestionScene
              fps={fps}
              question={question}
              index={index}
              total={questions.length}
              showAnswerReveal={showAnswerReveal}
              theme={theme}
            />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={outroFrames} premountFor={fps}>
          <ShortsOutroScene fps={fps} ctaUrl={ctaUrl} quizTitle={quiz.title} theme={theme} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
