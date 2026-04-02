import React from "react";
import { AbsoluteFill, Audio, Series, staticFile } from "remotion";
import { BrandBug } from "./BrandBug";
import {
  LANDSCAPE_QUESTION_ENTRY_SECONDS,
  LANDSCAPE_QUESTION_HOLD_SECONDS,
  LANDSCAPE_NO_REVEAL_SECONDS,
  LANDSCAPE_REVEAL_SECONDS,
  buildEpisodeSections,
  getLandscapeFactFrames,
  getLandscapeOutroFrames,
  getLandscapeQuestionFrames,
  getLandscapeSectionDividerFrames,
  getLandscapeTitleFrames,
} from "./episode";
import { FactInterstitialScene, getFactLine } from "./FactInterstitialScene";
import { OutroCtaScene } from "./OutroCtaScene";
import { QuestionEditorialScene } from "./QuestionEditorialScene";
import { SectionDividerScene } from "./SectionDividerScene";
import { StudioBackground } from "./StudioBackground";
import { TitleSequenceScene } from "./TitleSequenceScene";
import { getLandscapeTheme } from "./themes";
import type { QuizYoutubeLandscapeProps } from "../types";

type LandscapeQuizExperienceProps = Pick<
  QuizYoutubeLandscapeProps,
  "fps" | "quiz" | "questions" | "ctaUrl" | "showAnswerReveal" | "themeVariant"
>;

export const LandscapeQuizExperience: React.FC<LandscapeQuizExperienceProps> = ({
  fps,
  quiz,
  questions,
  ctaUrl,
  showAnswerReveal,
  themeVariant,
}) => {
  const theme = getLandscapeTheme(themeVariant, quiz.sport);
  const sections = buildEpisodeSections(questions);

  return (
    <AbsoluteFill>
      <StudioBackground theme={theme} />
      <BrandBug theme={theme} episodeLabel={theme.name} sport={quiz.sport} />
      <Audio src={staticFile("video/music/quiz-bed.mp3")} volume={0.11} loop />
      <Series>
        <Series.Sequence durationInFrames={getLandscapeTitleFrames(fps)}>
          <TitleSequenceScene
            fps={fps}
            title={quiz.title}
            sport={quiz.sport}
            difficulty={quiz.difficulty}
            questionCount={questions.length}
            coverImageUrl={quiz.coverImageUrl}
            theme={theme}
          />
        </Series.Sequence>

        {sections.map((section) => {
          return (
            <React.Fragment key={`section-${section.sectionIndex}`}>
              <Series.Sequence durationInFrames={getLandscapeSectionDividerFrames(fps)}>
                <SectionDividerScene
                  fps={fps}
                  sectionTitle={section.title}
                  sectionIndex={section.sectionIndex}
                  totalSections={sections.length}
                  startQuestion={section.startQuestionIndex}
                  endQuestion={section.endQuestionIndex}
                  totalQuestions={questions.length}
                  theme={theme}
                />
              </Series.Sequence>

              {section.questions.map((question, localIndex) => {
                const globalIndex = section.startQuestionIndex + localIndex;
                const duration = getLandscapeQuestionFrames(fps, question.timeLimitSeconds, showAnswerReveal);
                const thinkingFrames = Math.round(
                  Math.max(5, question.timeLimitSeconds) * fps + LANDSCAPE_QUESTION_ENTRY_SECONDS * fps
                );
                const revealFrames = Math.round(
                  (showAnswerReveal ? LANDSCAPE_REVEAL_SECONDS : LANDSCAPE_NO_REVEAL_SECONDS) * fps
                );
                const holdFrames = Math.round(LANDSCAPE_QUESTION_HOLD_SECONDS * fps);

                return (
                  <Series.Sequence key={question.id} durationInFrames={duration}>
                    <QuestionEditorialScene
                      fps={fps}
                      question={question}
                      index={globalIndex}
                      totalQuestions={questions.length}
                      sectionIndex={section.sectionIndex}
                      sectionTitle={section.title}
                      thinkingFrames={thinkingFrames}
                      revealFrames={revealFrames}
                      holdFrames={holdFrames}
                      showAnswerReveal={showAnswerReveal}
                      theme={theme}
                    />
                  </Series.Sequence>
                );
              })}

              <Series.Sequence durationInFrames={getLandscapeFactFrames(fps)}>
                <FactInterstitialScene
                  fps={fps}
                  fact={getFactLine(quiz.sport, section.sectionIndex)}
                  sectionIndex={section.sectionIndex}
                  theme={theme}
                />
              </Series.Sequence>
            </React.Fragment>
          );
        })}

        <Series.Sequence durationInFrames={getLandscapeOutroFrames(fps)}>
          <OutroCtaScene
            fps={fps}
            ctaUrl={ctaUrl}
            quizTitle={quiz.title}
            totalQuestions={questions.length}
            theme={theme}
          />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
