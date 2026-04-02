import React from "react";
import { AbsoluteFill, Audio, Series, staticFile } from "remotion";
import { getIntroFrames, getOutroFrames, getQuestionBlockFrames } from "../timing";
import type { QuizYoutubeLandscapeProps } from "../types";
import { ShortsCornerLogo } from "./ShortsCornerLogo";
import { ShortsIntroScene } from "./ShortsIntroScene";
import { ShortsLayeredBackground } from "./ShortsLayeredBackground";
import { ShortsOutroScene } from "./ShortsOutroScene";
import { ShortsQuestionScene } from "./ShortsQuestionScene";
import { resolveShortsTheme } from "./themes";

type ShortsQuizExperienceProps = Pick<
  QuizYoutubeLandscapeProps,
  "fps" | "themeVariant" | "quiz" | "ctaUrl" | "questions" | "showAnswerReveal"
>;

export const ShortsQuizExperience: React.FC<ShortsQuizExperienceProps> = ({
  fps,
  quiz,
  ctaUrl,
  questions,
  showAnswerReveal,
  themeVariant,
}) => {
  const introFrames = getIntroFrames(fps);
  const outroFrames = getOutroFrames(fps);
  const theme = resolveShortsTheme(themeVariant);

  return (
    <AbsoluteFill>
      <ShortsLayeredBackground theme={theme} />
      <ShortsCornerLogo theme={theme} />
      <Audio src={staticFile("video/music/quiz-bed.mp3")} volume={0.15} loop />
      <Series>
        <Series.Sequence durationInFrames={introFrames} premountFor={fps}>
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
