import { z } from "zod";
import { QuestionType, Difficulty } from "@prisma/client";

export const answerSchema = z.object({
  answerText: z.string().min(1, "Answer text is required"),
  answerImageUrl: z.string().url().optional().or(z.literal("")),
  answerVideoUrl: z.string().url().optional().or(z.literal("")),
  answerAudioUrl: z.string().url().optional().or(z.literal("")),
  isCorrect: z.boolean(),
  displayOrder: z.number().int().min(0).default(0),
});

export const questionSchema = z.object({
  type: z.nativeEnum(QuestionType).default(QuestionType.MULTIPLE_CHOICE),
  topicId: z.string().cuid("Invalid topic ID"),
  difficulty: z.nativeEnum(Difficulty).default(Difficulty.MEDIUM),
  
  questionText: z.string().min(3, "Question text must be at least 3 characters"),
  questionImageUrl: z.string().url().optional().or(z.literal("")),
  questionVideoUrl: z.string().url().optional().or(z.literal("")),
  questionAudioUrl: z.string().url().optional().or(z.literal("")),
  
  hint: z.string().optional(),
  explanation: z.string().optional(),
  explanationImageUrl: z.string().url().optional().or(z.literal("")),
  explanationVideoUrl: z.string().url().optional().or(z.literal("")),
  
  randomizeAnswerOrder: z.boolean().default(false),
  timeLimit: z.number().int().min(1).optional(),
  
  answers: z.array(answerSchema)
    .min(2, "At least 2 answers required")
    .refine(
      (answers) => answers.filter((a) => a.isCorrect).length === 1,
      "Exactly one answer must be correct"
    ),
});

export const questionUpdateSchema = questionSchema.partial().extend({
  answers: z.array(answerSchema.extend({
    id: z.string().cuid().optional(),
  })).optional(),
});

export const answerUpdateSchema = answerSchema.partial();

export type QuestionInput = z.infer<typeof questionSchema>;
export type QuestionUpdateInput = z.infer<typeof questionUpdateSchema>;
export type AnswerInput = z.infer<typeof answerSchema>;
export type AnswerUpdateInput = z.infer<typeof answerUpdateSchema>;

