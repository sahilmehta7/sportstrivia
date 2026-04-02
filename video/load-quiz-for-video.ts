import { Prisma } from "@prisma/client";
import fs from "node:fs/promises";
import path from "node:path";
import { resolveSelectionSeed } from "./seed";
import { quizVideoRenderInputSchema, type QuizVideoData, type QuizVideoRenderInputRaw } from "./types";

const MIN_TIME_LIMIT_SECONDS = 5;
const DEFAULT_TIME_PER_QUESTION_SECONDS = 30;

export const resolveQuestionTimeLimit = (
  overrideTimeLimitSeconds?: number | null,
  questionTimeLimit?: number | null,
  fallbackQuizTimePerQuestion?: number | null
) => {
  const resolved =
    overrideTimeLimitSeconds ?? questionTimeLimit ?? fallbackQuizTimePerQuestion ?? DEFAULT_TIME_PER_QUESTION_SECONDS;
  return Math.max(MIN_TIME_LIMIT_SECONDS, resolved);
};

type RawQuestion = {
  id: string;
  questionText: string;
  timeLimit?: number | null;
  answers: {
    id: string;
    answerText: string;
    isCorrect: boolean;
  }[];
};

type RawTopicConfig = {
  topicId: string;
  difficulty: string;
  questionCount: number;
};

export const quizVideoQuerySelect = {
  id: true,
  slug: true,
  title: true,
  descriptionImageUrl: true,
  sport: true,
  difficulty: true,
  timePerQuestion: true,
  recurringType: true,
  attemptResetPeriod: true,
  questionSelectionMode: true,
  isPublished: true,
  status: true,
  topicConfigs: {
    select: {
      topicId: true,
      difficulty: true,
      questionCount: true,
    },
  },
  questionPool: {
    orderBy: {
      order: "asc",
    },
    select: {
      question: {
        select: {
          id: true,
          questionText: true,
          timeLimit: true,
          answers: {
            select: {
              answerText: true,
              isCorrect: true,
            },
            orderBy: {
              displayOrder: "asc",
            },
          },
        },
      },
    },
  },
} satisfies Prisma.QuizSelect;

let envLoaded = false;

const ensureVideoEnvLoaded = async () => {
  if (envLoaded) return;
  const { loadEnvConfig } = await import("@next/env");
  loadEnvConfig(globalThis.process.cwd());
  envLoaded = true;
};

export const sanitizeQuestionForVideo = (args: {
  order: number;
  question: RawQuestion;
  quizSlug: string;
  questionTimeLimitOverrideSeconds?: number;
  fallbackQuizTimePerQuestion?: number | null;
}) => {
  const { order, question, questionTimeLimitOverrideSeconds, fallbackQuizTimePerQuestion, quizSlug } = args;
  const candidateAnswers = question.answers.slice(0, 4);
  const options = candidateAnswers.map((answer) => answer.answerText);
  const correctAnswerIndex = candidateAnswers.findIndex((answer) => answer.isCorrect);

  if (!options.length) {
    throw new Error(`Question "${question.id}" has no answer options.`);
  }
  if (correctAnswerIndex < 0) {
    throw new Error(`Question "${question.id}" has no correct answer configured.`);
  }

  return {
    id: question.id,
    order,
    questionText: question.questionText,
    timeLimitSeconds: resolveQuestionTimeLimit(
      questionTimeLimitOverrideSeconds,
      question.timeLimit,
      fallbackQuizTimePerQuestion
    ),
    options,
    correctAnswerIndex,
    voiceoverSrc: `/video/voiceovers/${quizSlug}/q-${String(order + 1).padStart(2, "0")}.mp3`,
  };
};

export const shouldUseDailyTopicFallback = (quiz: {
  recurringType?: string | null;
  attemptResetPeriod?: string | null;
}) => {
  return quiz.recurringType === "DAILY" || quiz.attemptResetPeriod === "DAILY";
};

export const selectQuestionsFromTopicSets = (
  selectionMode: "FIXED" | "TOPIC_RANDOM" | "POOL_RANDOM",
  topicQuestionSets: Array<{ questionCount: number; questions: RawQuestion[] }>,
  seed?: string
) => {
  return topicQuestionSets.flatMap((set, index) => {
    const selected =
      selectionMode === "TOPIC_RANDOM"
        ? seededShuffle(set.questions, `${seed ?? "topic"}:${index}`).slice(0, set.questionCount)
        : set.questions.slice(0, set.questionCount);
    return selected;
  });
};

const hashSeed = (seed: string) => {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const createSeededRng = (seed: string) => {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const seededShuffle = <T>(items: readonly T[], seed: string) => {
  const result = [...items];
  const rng = createSeededRng(seed);
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const selectQuestionsForVideo = <T>(args: {
  questions: T[];
  maxQuestions: number;
  shuffle: boolean;
  seed?: string;
  shuffler?: (items: readonly T[], seed: string) => T[];
}) => {
  const { questions, maxQuestions, shuffle, seed = "video", shuffler = seededShuffle } = args;
  const source = shuffle ? shuffler(questions, seed) : questions;
  return source.slice(0, maxQuestions);
};

const loadDailyFallbackQuestions = async (args: {
  topicConfigs: RawTopicConfig[];
  questionSelectionMode: "FIXED" | "TOPIC_RANDOM" | "POOL_RANDOM";
  seed: string;
}) => {
  const { topicConfigs, questionSelectionMode, seed } = args;
  if (!topicConfigs.length) {
    return [];
  }

  const { prisma } = await import("../lib/db");
  const { getTopicIdsWithDescendants } = await import("../lib/services/topic.service");

  const topicQuestionSets = await Promise.all(
    topicConfigs.map(async (config) => {
      const topicIds = await getTopicIdsWithDescendants(config.topicId);
      const questions = await prisma.question.findMany({
        where: {
          topicId: { in: topicIds },
          difficulty: config.difficulty as any,
        },
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          questionText: true,
          timeLimit: true,
          answers: {
            select: {
              answerText: true,
              isCorrect: true,
            },
            orderBy: {
              displayOrder: "asc",
            },
          },
        },
      });

      return {
        questionCount: config.questionCount,
        questions: questions as RawQuestion[],
      };
    })
  );

  const compatibleSelectionMode =
    questionSelectionMode === "POOL_RANDOM" ? "TOPIC_RANDOM" : questionSelectionMode;

  return selectQuestionsFromTopicSets(compatibleSelectionMode, topicQuestionSets, seed);
};

export const loadQuizForVideo = async (rawInput: QuizVideoRenderInputRaw): Promise<QuizVideoData> => {
  const input = quizVideoRenderInputSchema.parse(rawInput);
  await ensureVideoEnvLoaded();

  if (!globalThis.process.env.DATABASE_URL && !globalThis.process.env.DIRECT_URL) {
    throw new Error(
      "DATABASE_URL or DIRECT_URL is missing. Add it to .env/.env.local before running video commands."
    );
  }

  const { prisma } = await import("../lib/db");

  const quiz = await prisma.quiz.findFirst({
    where: input.quizId
      ? { id: input.quizId }
      : {
          slug: input.quizSlug,
        },
    select: quizVideoQuerySelect,
  });

  if (!quiz) {
    throw new Error("Quiz not found for provided quizId/quizSlug.");
  }

  if (!quiz.isPublished || quiz.status !== "PUBLISHED") {
    throw new Error("Quiz must be published before rendering a YouTube video.");
  }
  const selectionSeed = resolveSelectionSeed({
    seed: input.seed,
    quizSlug: quiz.slug,
    quizId: quiz.id,
  });

  let sourceQuestions: RawQuestion[] = [];

  if (quiz.questionPool.length) {
    sourceQuestions = quiz.questionPool.map((poolItem) => poolItem.question as RawQuestion);
  } else if (shouldUseDailyTopicFallback(quiz)) {
    sourceQuestions = await loadDailyFallbackQuestions({
      topicConfigs: quiz.topicConfigs as RawTopicConfig[],
      questionSelectionMode: quiz.questionSelectionMode as "FIXED" | "TOPIC_RANDOM" | "POOL_RANDOM",
      seed: selectionSeed,
    });
    if (!sourceQuestions.length) {
      throw new Error("Daily quiz has no questions in its pool or topic-config fallback.");
    }
  } else {
    throw new Error("Quiz has no questions in its pool.");
  }

  const maxQuestions = input.questionLimit ?? sourceQuestions.length;
  const selectedSourceQuestions = selectQuestionsForVideo({
    questions: sourceQuestions,
    maxQuestions,
    shuffle: quiz.questionPool.length > 0,
    seed: selectionSeed,
  });

  const questions = selectedSourceQuestions.map((question, index) =>
    sanitizeQuestionForVideo({
      order: index,
      question,
      quizSlug: quiz.slug,
      questionTimeLimitOverrideSeconds: input.questionTimeLimitSeconds,
      fallbackQuizTimePerQuestion: quiz.timePerQuestion,
    })
  );

  const questionsWithVoiceovers = await Promise.all(
    questions.map(async (question) => {
      const relative = question.voiceoverSrc?.replace(/^\//, "");
      if (!relative) {
        return question;
      }
      const absolute = path.resolve(globalThis.process.cwd(), "public", relative.replace(/^video\//, "video/"));
      try {
        await fs.access(absolute);
        return question;
      } catch {
        return { ...question, voiceoverSrc: null };
      }
    })
  );

  const siteBaseUrl = (
    globalThis.process.env.NEXT_PUBLIC_APP_URL || "https://www.sportstrivia.in"
  ).replace(/\/$/, "");
  const ctaUrl = `${siteBaseUrl}/quizzes/${quiz.slug}`;

  return {
    quiz: {
      id: quiz.id,
      slug: quiz.slug,
      title: quiz.title,
      sport: quiz.sport,
      difficulty: quiz.difficulty,
      coverImageUrl: quiz.descriptionImageUrl,
    },
    defaults: {
      timePerQuestion: resolveQuestionTimeLimit(input.questionTimeLimitSeconds, undefined, quiz.timePerQuestion),
    },
    selectionSeed,
    questions: questionsWithVoiceovers,
    ctaUrl,
  };
};
