import { z } from "zod";
import { 
  Difficulty, 
  QuizStatus, 
  QuestionSelectionMode, 
  RecurringType 
} from "@prisma/client";

export const quizSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  slug: z.string().optional(),
  description: z.string().optional(),
  descriptionImageUrl: z.string().url().optional().or(z.literal("")),
  descriptionVideoUrl: z.string().url().optional().or(z.literal("")),
  sport: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
  status: z.nativeEnum(QuizStatus).default(QuizStatus.DRAFT),
  
  // Quiz configuration
  duration: z.number().int().min(1).optional(),
  timePerQuestion: z.number().int().min(1).optional(),
  passingScore: z.number().int().min(0).max(100).default(70),
  
  // Question selection
  questionSelectionMode: z.nativeEnum(QuestionSelectionMode).default(QuestionSelectionMode.FIXED),
  questionCount: z.number().int().min(1).optional(),
  randomizeQuestionOrder: z.boolean().default(false),
  showHints: z.boolean().default(true),
  
  // Scoring
  negativeMarkingEnabled: z.boolean().default(false),
  penaltyPercentage: z.number().int().min(0).max(100).default(25),
  timeBonusEnabled: z.boolean().default(false),
  bonusPointsPerSecond: z.number().min(0).default(0),
  
  // Scheduling
  startTime: z.string().datetime().optional().or(z.literal("")),
  endTime: z.string().datetime().optional().or(z.literal("")),
  answersRevealTime: z.string().datetime().optional().or(z.literal("")),
  
  // Recurring
  recurringType: z.nativeEnum(RecurringType).default(RecurringType.NONE),
  
  // SEO
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.array(z.string()).optional(),
  
  // Visibility
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(false),
});

export const quizUpdateSchema = quizSchema.partial();

export const quizTopicConfigSchema = z.object({
  topicId: z.string().cuid(),
  difficulty: z.nativeEnum(Difficulty),
  questionCount: z.number().int().min(1),
});

export const quizImportSchema = z.object({
  title: z.string().min(3),
  slug: z.string().optional(),
  sport: z.string().optional(),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
  duration: z.number().int().min(1).optional(),
  passingScore: z.number().int().min(0).max(100).default(70),
  seo: z.object({
    title: z.string().max(60).optional(),
    description: z.string().max(160).optional(),
    keywords: z.array(z.string()).optional(),
  }).optional(),
  questions: z.array(z.object({
    text: z.string().min(1),
    type: z.string().optional(),
    difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
    topicId: z.string().optional(), // Made optional - will use default topic if not provided
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

