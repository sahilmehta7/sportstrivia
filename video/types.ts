import { z } from "zod";
import { DEFAULT_FPS, DEFAULT_LOGO_CORNER, DEFAULT_THEME_VARIANT } from "./constants";

const nonEmptyString = z.string().trim().min(1);

export const quizVideoRenderInputSchema = z
  .object({
    quizId: nonEmptyString.optional(),
    quizSlug: nonEmptyString.optional(),
    seed: nonEmptyString.optional(),
    questionLimit: z.number().int().positive().max(200).optional(),
    fps: z.number().int().min(24).max(60).default(DEFAULT_FPS),
    showAnswerReveal: z.boolean().default(true),
    themeVariant: z.literal(DEFAULT_THEME_VARIANT).default(DEFAULT_THEME_VARIANT),
    logoCorner: z.literal(DEFAULT_LOGO_CORNER).default(DEFAULT_LOGO_CORNER),
  })
  .superRefine((value, ctx) => {
    const sourceCount = Number(Boolean(value.quizId)) + Number(Boolean(value.quizSlug));
    if (sourceCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Exactly one of quizId or quizSlug must be provided.",
        path: ["quizId"],
      });
    }
  });

export type QuizVideoRenderInput = z.infer<typeof quizVideoRenderInputSchema>;
export type QuizVideoRenderInputRaw = z.input<typeof quizVideoRenderInputSchema>;

export type QuizVideoQuestion = {
  id: string;
  order: number;
  questionText: string;
  timeLimitSeconds: number;
  options: string[];
  correctAnswerIndex: number;
  voiceoverSrc?: string | null;
};

export type QuizVideoData = {
  quiz: {
    id: string;
    slug: string;
    title: string;
    sport: string | null;
    difficulty: string;
    coverImageUrl: string | null;
  };
  defaults: {
    timePerQuestion: number;
  };
  selectionSeed: string;
  questions: QuizVideoQuestion[];
  ctaUrl: string;
};

export type QuizYoutubeLandscapeProps = {
  fps: number;
  showAnswerReveal: boolean;
  themeVariant: "dark";
  logoCorner: "top-right";
  quiz: QuizVideoData["quiz"];
  ctaUrl: string;
  questions: QuizVideoQuestion[];
};
