import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { CoverScene } from "./components/CoverScene";
import { CornerLogo } from "./components/CornerLogo";
import { IntroScene } from "./components/IntroScene";
import { LayeredBackground } from "./components/LayeredBackground";
import { OutroScene } from "./components/OutroScene";
import { QuestionScene } from "./components/QuestionScene";
import { getCoverFrames, getIntroFrames, getOutroFrames, getQuestionBlockFrames } from "./timing";
import type { QuizYoutubeLandscapeProps } from "./types";

export const QuizYoutubeLandscape: React.FC<QuizYoutubeLandscapeProps> = (props) => {
  const { fps, quiz, questions, ctaUrl, showAnswerReveal } = props;
  const coverFrames = getCoverFrames(fps);
  const introFrames = getIntroFrames(fps);
  const outroFrames = getOutroFrames(fps);

  return (
    <AbsoluteFill>
      <LayeredBackground />
      <CornerLogo />
      <Series>
        <Series.Sequence durationInFrames={coverFrames} premountFor={fps}>
          <CoverScene fps={fps} title={quiz.title} coverImageUrl={quiz.coverImageUrl} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={introFrames} premountFor={fps}>
          <IntroScene fps={fps} title={quiz.title} sport={quiz.sport} difficulty={quiz.difficulty} />
        </Series.Sequence>
        {questions.map((question, index) => (
          <Series.Sequence
            key={question.id}
            durationInFrames={getQuestionBlockFrames(fps, question.timeLimitSeconds)}
            premountFor={fps}
          >
            <QuestionScene
              fps={fps}
              question={question}
              index={index}
              total={questions.length}
              showAnswerReveal={showAnswerReveal}
            />
          </Series.Sequence>
        ))}
        <Series.Sequence durationInFrames={outroFrames} premountFor={fps}>
          <OutroScene fps={fps} ctaUrl={ctaUrl} quizTitle={quiz.title} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
