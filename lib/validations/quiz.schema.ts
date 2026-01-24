import { z } from "zod";
import {
  Difficulty,
  QuizStatus,
  QuestionSelectionMode,
  RecurringType,
} from "@prisma/client";
import {
  AttemptResetPeriod,
  ATTEMPT_RESET_PERIODS,
  type AttemptResetPeriodValue,
} from "@/constants/attempts";

const baseQuizSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  slug: z.string().optional(),
  description: z.string().optional(),
  descriptionImageUrl: z.string().url().optional().or(z.literal("")),
  descriptionVideoUrl: z.string().url().optional().or(z.literal("")),
  sport: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  status: z.nativeEnum(QuizStatus).optional(),

  // Quiz configuration
  duration: z.number().int().min(1).nullish(),
  timePerQuestion: z.number().int().min(1).nullish(),
  passingScore: z.number().int().min(0).max(100).optional(),
  completionBonus: z.number().int().min(0).optional(),
  maxAttemptsPerUser: z
    .number()
    .int()
    .min(1)
    .nullable()
    .optional(),
  attemptResetPeriod: z
    .enum(ATTEMPT_RESET_PERIODS)
    .optional(),

  // Question selection
  questionSelectionMode: z.nativeEnum(QuestionSelectionMode).optional(),
  questionCount: z.number().int().min(1).nullish(),
  randomizeQuestionOrder: z.boolean().optional(),
  showHints: z.boolean().optional(),

  // Scoring
  negativeMarkingEnabled: z.boolean().optional(),
  penaltyPercentage: z.number().int().min(0).max(100).optional(),
  timeBonusEnabled: z.boolean().optional(),
  bonusPointsPerSecond: z.number().min(0).optional(),

  // Scheduling - accept datetime-local format (YYYY-MM-DDTHH:mm) or ISO 8601
  startTime: z.preprocess(
    (val) => {
      if (!val || val === "" || (typeof val === "string" && val.trim() === "")) {
        return undefined;
      }
      return val;
    },
    z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3})?([+-]\d{2}:\d{2}|Z)?$/).optional()
  ),
  endTime: z.preprocess(
    (val) => {
      if (!val || val === "" || (typeof val === "string" && val.trim() === "")) {
        return undefined;
      }
      return val;
    },
    z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3})?([+-]\d{2}:\d{2}|Z)?$/).optional()
  ),
  answersRevealTime: z.preprocess(
    (val) => {
      if (!val || val === "" || (typeof val === "string" && val.trim() === "")) {
        return undefined;
      }
      return val;
    },
    z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d{3})?([+-]\d{2}:\d{2}|Z)?$/).optional()
  ),

  // Recurring
  recurringType: z.nativeEnum(RecurringType).optional(),

  // SEO
  seoTitle: z.string().max(100).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.array(z.string()).optional(),

  // Visibility
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export const quizSchema = baseQuizSchema.extend({
  difficulty: z.nativeEnum(Difficulty).optional().default(Difficulty.MEDIUM),
  status: z.nativeEnum(QuizStatus).optional().default(QuizStatus.DRAFT),
  passingScore: z.number().int().min(0).max(100).optional().default(70),
  completionBonus: z.number().int().min(0).optional().default(0),
  attemptResetPeriod: z
    .enum(ATTEMPT_RESET_PERIODS)
    .optional()
    .default(AttemptResetPeriod.NEVER),
  questionSelectionMode: z.nativeEnum(QuestionSelectionMode).optional().default(QuestionSelectionMode.FIXED),
  randomizeQuestionOrder: z.boolean().optional().default(false),
  showHints: z.boolean().optional().default(true),
  negativeMarkingEnabled: z.boolean().optional().default(false),
  penaltyPercentage: z.number().int().min(0).max(100).optional().default(25),
  timeBonusEnabled: z.boolean().optional().default(false),
  bonusPointsPerSecond: z.number().min(0).optional().default(0),
  recurringType: z.nativeEnum(RecurringType).optional().default(RecurringType.NONE),
  isFeatured: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(false),
});

export const quizUpdateSchema = baseQuizSchema.partial();

export const quizTopicConfigSchema = z.object({
  topicId: z.string().cuid(),
  difficulty: z.nativeEnum(Difficulty),
  questionCount: z.number().int().min(1),
});

export const quizImportSchema = z.object({
  title: z.string().min(3),
  slug: z.string().optional(),
  description: z.string().optional(),
  sport: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
  duration: z.number().int().min(1).optional(),
  timePerQuestion: z.number().int().min(1).optional().default(60),
  maxAttemptsPerUser: z.number().int().min(1).optional().default(1),
  showHints: z.boolean().optional().default(false),
  randomizeQuestionOrder: z.boolean().optional().default(true),
  completionBonus: z.number().int().min(0).optional(),
  passingScore: z.number().int().min(0).max(100).default(70),
  seo: z.object({
    title: z.string().max(100).optional(),
    description: z.string().max(160).optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
  questions: z.array(z.object({
    text: z.string().min(1),
    type: z.string().optional(),
    difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
    topic: z.string().min(1).optional(), // Optional topic name, defaults to General if missing
    hint: z.string().optional(),
    explanation: z.string().optional(),
    order: z.number().int().optional(),
    answers: z.array(z.object({
      text: z.string().min(1),
      isCorrect: z.boolean(),
      imageUrl: z.string().url().optional(),
    })).min(2).refine(
      (answers) => answers.filter((a) => a.isCorrect).length === 1,
      "Exactly one answer must be correct"
    ),
  })).min(1),
});

export type QuizInput = z.infer<typeof quizSchema>;
export type QuizUpdateInput = z.infer<typeof quizUpdateSchema>;
export type QuizTopicConfigInput = z.infer<typeof quizTopicConfigSchema>;
export type QuizImportInput = z.infer<typeof quizImportSchema>;
export type QuizAttemptResetPeriod = AttemptResetPeriodValue;
