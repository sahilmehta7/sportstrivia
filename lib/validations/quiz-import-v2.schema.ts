import { z } from "zod";

// Alternative JSON import format (user-friendly)
export const quizImportV2Schema = z.object({
  quiz_title: z.string().min(3),
  short_description: z.string().optional(),
  category: z.string().optional(), // e.g., "Cricket • IPL"
  difficulty: z.enum(["Easy", "Intermediate", "Advanced", "Expert"]).optional(),
  num_questions: z.number().int().min(1).optional(),
  shuffle_questions: z.boolean().optional(),
  shuffle_choices: z.boolean().optional(),
  time_limit_seconds: z.number().int().min(1).optional(),
  passing_score_percent: z.number().int().min(0).max(100).optional(),
  questions: z.array(z.object({
    question: z.string().min(1),
    topic: z.string().optional(),
    hint: z.string().optional(),
    choices: z.array(z.string()).min(2),
    correct_option: z.string().regex(/^[A-Z]$/, "Must be A, B, C, D, etc."),
    explanation: z.string().optional(),
  })).min(1),
});

export type QuizImportV2Input = z.infer<typeof quizImportV2Schema>;

// Transformer to convert V2 format to internal format
export function transformV2ToInternal(v2Data: QuizImportV2Input) {
  // Map difficulty names to our enum
  const difficultyMap: Record<string, string> = {
    "Easy": "EASY",
    "Intermediate": "MEDIUM",
    "Advanced": "HARD",
    "Expert": "HARD",
  };

  const difficulty = v2Data.difficulty 
    ? difficultyMap[v2Data.difficulty] || "MEDIUM"
    : "MEDIUM";

  // Extract sport from category (e.g., "Cricket • IPL" → "Cricket")
  const sport = v2Data.category?.split("•")[0].trim();

  // Transform questions
  const questions = v2Data.questions.map((q) => {
    // Convert correct_option letter to index (A=0, B=1, C=2, etc.)
    const correctIndex = q.correct_option.charCodeAt(0) - 65; // 'A' = 65

    return {
      text: q.question,
      topic: q.topic || "General", // Topic name, will be created if doesn't exist
      difficulty,
      hint: q.hint,
      explanation: q.explanation,
      answers: q.choices.map((choice, idx) => ({
        text: choice,
        isCorrect: idx === correctIndex,
      })),
    };
  });

  return {
    title: v2Data.quiz_title,
    description: v2Data.short_description,
    sport,
    difficulty,
    duration: v2Data.time_limit_seconds,
    passingScore: v2Data.passing_score_percent || 70,
    randomizeQuestionOrder: v2Data.shuffle_questions || false,
    shuffleChoices: v2Data.shuffle_choices || false, // Will apply to all questions
    questions,
  };
}

