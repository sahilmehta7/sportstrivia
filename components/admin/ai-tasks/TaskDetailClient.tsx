"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Loader2, ArrowLeft, Sparkles, ListChecks } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

type BackgroundTaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "CANCELLED";
type BackgroundTaskType =
  | "AI_QUIZ_GENERATION"
  | "AI_TOPIC_QUESTION_GENERATION"
  | "AI_QUIZ_IMPORT"
  | "AI_TOPIC_QUESTION_IMPORT";

interface PreviewAnswer {
  text: string;
  isCorrect: boolean;
  imageUrl?: string;
}

interface PreviewQuestion {
  text: string;
  difficulty: string;
  topic?: string;
  hint?: string;
  explanation?: string;
  order?: number;
  type?: string;
  answers: PreviewAnswer[];
}

interface NormalizedQuiz {
  title: string;
  slug?: string;
  description?: string;
  sport?: string;
  difficulty: string;
  duration?: number;
  passingScore: number;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  questions: PreviewQuestion[];
}

export interface SerializedBackgroundTask {
  id: string;
  label: string;
  type: BackgroundTaskType;
  status: BackgroundTaskStatus;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
  errorMessage: string | null;
  input: any;
  result: any;
}

function statusVariant(
  status: BackgroundTaskStatus
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "IN_PROGRESS":
      return "secondary";
    case "PENDING":
      return "outline";
    case "CANCELLED":
    case "FAILED":
      return "destructive";
    default:
      return "secondary";
  }
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatType(type: BackgroundTaskType): string {
  switch (type) {
    case "AI_QUIZ_GENERATION":
      return "AI Quiz Generation";
    case "AI_TOPIC_QUESTION_GENERATION":
      return "AI Question Generation";
    case "AI_QUIZ_IMPORT":
      return "AI Quiz Import";
    case "AI_TOPIC_QUESTION_IMPORT":
      return "AI Question Import";
    default:
      return type.replace(/_/g, " ");
  }
}

function ensureArrayOfStrings(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const cleaned = value
    .map((item) => (typeof item === "string" ? item : String(item)))
    .map((item) => item.trim())
    .filter(Boolean);
  return cleaned.length ? cleaned : undefined;
}

function mapQuestionsToPreview(
  rawQuestions: unknown,
  fallbackDifficulty = "MEDIUM"
): PreviewQuestion[] {
  if (!Array.isArray(rawQuestions)) return [];

  return rawQuestions
    .map((rawQuestion, index) => {
      const question = rawQuestion as Record<string, unknown>;
      const text =
        typeof question.text === "string" && question.text.trim()
          ? question.text.trim()
          : typeof question.questionText === "string" && question.questionText.trim()
            ? question.questionText.trim()
            : typeof question.prompt === "string" && question.prompt.trim()
              ? question.prompt.trim()
              : "";
      if (!text) {
        return null;
      }

      const rawAnswers = Array.isArray(question.answers) ? question.answers : [];
      const answers: PreviewAnswer[] = rawAnswers
        .map((rawAnswer) => {
          const answer = rawAnswer as Record<string, unknown>;
          const answerText =
            typeof answer.text === "string" && answer.text.trim()
              ? answer.text.trim()
              : typeof answer.answerText === "string" && answer.answerText.trim()
                ? answer.answerText.trim()
                : typeof answer.label === "string" && answer.label.trim()
                  ? answer.label.trim()
                  : "";
          if (!answerText) {
            return null;
          }

          const imageUrl =
            typeof answer.imageUrl === "string" && answer.imageUrl.trim()
              ? answer.imageUrl.trim()
              : typeof answer.answerImageUrl === "string" && answer.answerImageUrl.trim()
                ? answer.answerImageUrl.trim()
                : undefined;

          const isCorrect = Boolean(
            answer.isCorrect ??
              answer.correct ??
              answer.is_correct ??
              (typeof answer.score === "number" ? answer.score > 0 : false) ??
              (typeof answer.weight === "number" ? answer.weight > 0 : false)
          );

          return {
            text: answerText,
            isCorrect,
            imageUrl,
          };
        })
        .filter((answer): answer is PreviewAnswer => Boolean(answer));

      if (!answers.length) {
        return null;
      }

      if (!answers.some((answer) => answer.isCorrect)) {
        answers[0] = { ...answers[0], isCorrect: true };
      }

      const difficultyRaw =
        question.difficulty ??
        question.level ??
        (typeof fallbackDifficulty === "string" ? fallbackDifficulty : "MEDIUM");

      const topicRaw = question.topic ?? question.topicName ?? question.category;
      const typeRaw = typeof question.type === "string" ? question.type : undefined;

      return {
        text,
        difficulty: String(difficultyRaw || "MEDIUM").toUpperCase(),
        topic: typeof topicRaw === "string" && topicRaw.trim() ? topicRaw.trim() : undefined,
        hint: typeof question.hint === "string" && question.hint.trim() ? question.hint.trim() : undefined,
        explanation:
          typeof question.explanation === "string" && question.explanation.trim()
            ? question.explanation.trim()
            : undefined,
        order:
          typeof question.order === "number"
            ? question.order
            : typeof question.index === "number"
              ? question.index
              : index + 1,
        type: typeRaw,
        answers,
      };
    })
    .filter((question): question is PreviewQuestion => Boolean(question));
}

function normalizeQuizForImport(rawQuiz: any): NormalizedQuiz | null {
  if (!rawQuiz) return null;

  const titleCandidate =
    typeof rawQuiz.title === "string" && rawQuiz.title.trim()
      ? rawQuiz.title.trim()
      : typeof rawQuiz.metadata?.customTitle === "string" && rawQuiz.metadata.customTitle.trim()
        ? rawQuiz.metadata.customTitle.trim()
        : "Untitled AI Quiz";

  const difficulty = String(rawQuiz.difficulty || "MEDIUM").toUpperCase();
  const normalizedQuestions = mapQuestionsToPreview(rawQuiz.questions, difficulty);

  if (!normalizedQuestions.length) {
    return null;
  }

  const duration =
    typeof rawQuiz.duration === "number" && rawQuiz.duration > 0
      ? Math.floor(rawQuiz.duration)
      : undefined;

  const passingScoreRaw =
    typeof rawQuiz.passingScore === "number" ? rawQuiz.passingScore : undefined;
  const passingScore =
    typeof passingScoreRaw === "number" && Number.isFinite(passingScoreRaw)
      ? Math.min(100, Math.max(0, Math.round(passingScoreRaw)))
      : 70;

  const rawSeo = (rawQuiz.seo && typeof rawQuiz.seo === "object") ? (rawQuiz.seo as Record<string, unknown>) : {};

  const seoKeywords =
    ensureArrayOfStrings(rawQuiz.seoKeywords) || ensureArrayOfStrings(rawSeo.keywords);

  const seoTitle =
    typeof rawQuiz.seoTitle === "string" && rawQuiz.seoTitle.trim()
      ? rawQuiz.seoTitle.trim()
      : typeof rawSeo.title === "string" && (rawSeo.title as string).trim()
        ? (rawSeo.title as string).trim()
        : undefined;

  const seoDescription =
    typeof rawQuiz.seoDescription === "string" && rawQuiz.seoDescription.trim()
      ? rawQuiz.seoDescription.trim()
      : typeof rawSeo.description === "string" && (rawSeo.description as string).trim()
        ? (rawSeo.description as string).trim()
        : undefined;

  const seo =
    seoTitle || seoDescription || seoKeywords
      ? {
          title: seoTitle,
          description: seoDescription,
          keywords: seoKeywords,
        }
      : undefined;

  const sportCandidate =
    typeof rawQuiz.sport === "string" && rawQuiz.sport.trim()
      ? rawQuiz.sport.trim()
      : typeof rawQuiz.metadata?.sport === "string" && rawQuiz.metadata.sport.trim()
        ? rawQuiz.metadata.sport.trim()
        : undefined;

  return {
    title: titleCandidate,
    slug: typeof rawQuiz.slug === "string" ? rawQuiz.slug : undefined,
    description:
      typeof rawQuiz.description === "string" && rawQuiz.description.trim()
        ? rawQuiz.description.trim()
        : undefined,
    sport: sportCandidate,
    difficulty,
    duration,
    passingScore,
    seo,
    questions: normalizedQuestions,
  };
}

function RawJsonViewer({ data, label }: { data: unknown; label: string }) {
  if (data == null) return null;
  return (
    <details className="overflow-hidden rounded-md border border-dashed border-border/40 bg-muted/30">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-muted-foreground">
        {label}
      </summary>
      <pre className="max-h-[420px] overflow-auto bg-background/80 p-3 text-xs text-muted-foreground">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

function QuestionPreviewList({ questions }: { questions: PreviewQuestion[] }) {
  if (!questions.length) return null;
  return (
    <div className="space-y-3">
      {questions.map((question, index) => (
        <div
          key={`${question.order ?? index}-${question.text.slice(0, 24)}`}
          className="rounded-lg border border-border/50 bg-card/40 p-4 shadow-sm"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="text-sm font-semibold leading-snug text-foreground">
              {index + 1}. {question.text}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge variant="secondary">{question.difficulty}</Badge>
              {question.topic && (
                <Badge variant="outline" className="border-border/60 text-muted-foreground">
                  {question.topic}
                </Badge>
              )}
            </div>
          </div>
          {question.hint && (
            <p className="mt-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Hint:</span> {question.hint}
            </p>
          )}
          {question.explanation && (
            <p className="mt-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Explanation:</span> {question.explanation}
            </p>
          )}
          <ul className="mt-3 space-y-2 text-sm">
            {question.answers.map((answer, answerIdx) => (
              <li
                key={`${answerIdx}-${question.order ?? index}-${answer.text.slice(0, 12)}`}
                className={cn(
                  "flex items-start gap-2 rounded-md border px-3 py-2 transition",
                  answer.isCorrect
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-border/40 bg-muted/40 text-muted-foreground"
                )}
              >
                <span className="mt-0.5 rounded bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {String.fromCharCode(65 + answerIdx)}
                </span>
                <span className="flex-1">{answer.text}</span>
                {answer.isCorrect && (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                    Correct
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value?: string | number }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

export function TaskDetailClient({ task }: { task: SerializedBackgroundTask }) {
  const { toast } = useToast();
  const [importingQuiz, setImportingQuiz] = useState(false);
  const [importingQuestions, setImportingQuestions] = useState(false);
  const [importedQuizId, setImportedQuizId] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [questionsImported, setQuestionsImported] = useState(false);

  const isCompleted = task.status === "COMPLETED";

  const quizPreview = useMemo(() => {
    if (task.type !== "AI_QUIZ_GENERATION") return null;
    return task.result?.quiz ?? null;
  }, [task]);

  const questionPreview = useMemo(() => {
    if (task.type !== "AI_TOPIC_QUESTION_GENERATION") return null;
    return Array.isArray(task.result?.questions) ? task.result.questions : null;
  }, [task]);

  const normalizedQuiz = useMemo(
    () => (quizPreview ? normalizeQuizForImport(quizPreview) : null),
    [quizPreview]
  );

  const normalizedQuizQuestions = normalizedQuiz?.questions ?? [];

  const questionPreviewList = useMemo(
    () => (questionPreview ? mapQuestionsToPreview(questionPreview) : []),
    [questionPreview]
  );

  async function handleImportQuiz() {
    if (!quizPreview) {
      toast({
        title: "No quiz data",
        description: "The generated quiz payload is missing.",
        variant: "destructive",
      });
      return;
    }

    setImportingQuiz(true);
    setImportSummary(null);

    try {
      const payload = normalizedQuiz ?? normalizeQuizForImport(quizPreview);
      if (!payload) {
        throw new Error("Quiz output could not be normalized into an importable format.");
      }

      const payloadForImport: Record<string, any> = {
        title: payload.title,
        difficulty: payload.difficulty,
        passingScore: payload.passingScore,
        questions: payload.questions.map((question) => {
          const answers = question.answers.map((answer) => {
            const answerPayload: Record<string, any> = {
              text: answer.text,
              isCorrect: !!answer.isCorrect,
            };
            if (answer.imageUrl) {
              answerPayload.imageUrl = answer.imageUrl;
            }
            return answerPayload;
          });

          const questionPayload: Record<string, any> = {
            text: question.text,
            type: question.type ?? "MULTIPLE_CHOICE",
            difficulty: question.difficulty,
            answers,
          };

          if (question.topic) {
            questionPayload.topic = question.topic;
          }
          if (question.hint) {
            questionPayload.hint = question.hint;
          }
          if (question.explanation) {
            questionPayload.explanation = question.explanation;
          }
          if (typeof question.order === "number") {
            questionPayload.order = question.order;
          }

          return questionPayload;
        }),
      };

      if (payload.slug) {
        payloadForImport.slug = payload.slug;
      }
      if (payload.description) {
        payloadForImport.description = payload.description;
      }
      if (payload.sport) {
        payloadForImport.sport = payload.sport;
      }
      if (typeof payload.duration === "number") {
        payloadForImport.duration = payload.duration;
      }
      if (payload.seo) {
        const seo = { ...payload.seo };
        if (!seo.title) {
          delete seo.title;
        }
        if (!seo.description) {
          delete seo.description;
        }
        if (!seo.keywords || seo.keywords.length === 0) {
          delete seo.keywords;
        }

        if (Object.keys(seo).length > 0) {
          payloadForImport.seo = seo;
        }
      }

      const response = await fetch("/api/admin/quizzes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadForImport),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to import quiz");
      }

      const newQuizId: string | undefined = data?.data?.quiz?.id;
      setImportedQuizId(newQuizId ?? null);
      setImportSummary(
        `Quiz "${payload.title}" imported with ${payloadForImport.questions.length} question${
          payloadForImport.questions.length === 1 ? "" : "s"
        }.`
      );

      toast({
        title: "Quiz imported",
        description: "The AI-generated quiz is now available in your quiz library.",
      });
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "Unable to import quiz",
        variant: "destructive",
      });
    } finally {
      setImportingQuiz(false);
    }
  }

  async function handleImportQuestions() {
    const questions = questionPreviewList;
    const topicId: string | undefined =
      task.result?.topicId || task.input?.topicId || task.input?.topic?.id;

    if (questions.length === 0) {
      toast({
        title: "No questions",
        description: "This task does not include generated questions.",
        variant: "destructive",
      });
      return;
    }

    if (!topicId) {
      toast({
        title: "Missing topic",
        description: "Cannot determine which topic to import the questions into.",
        variant: "destructive",
      });
      return;
    }

    setImportingQuestions(true);
    setImportSummary(null);

    try {
      let created = 0;
      for (const question of questions) {
        const payload = {
          type: "MULTIPLE_CHOICE",
          topicId,
          difficulty: question.difficulty || "MEDIUM",
          questionText: question.text,
          questionImageUrl: "",
          questionVideoUrl: "",
          questionAudioUrl: "",
          hint: question.hint || undefined,
          explanation: question.explanation || undefined,
          explanationImageUrl: "",
          explanationVideoUrl: "",
          randomizeAnswerOrder: false,
          timeLimit: undefined,
          answers: (question.answers || []).map((answer, index) => ({
            answerText: answer.text,
            answerImageUrl: answer.imageUrl ?? "",
            answerVideoUrl: "",
            answerAudioUrl: "",
            isCorrect: !!answer.isCorrect,
            displayOrder: index,
          })),
        };

        const response = await fetch("/api/admin/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || "Failed to import one of the questions");
        }

        created += 1;
      }

      setImportSummary(`Imported ${created} question${created === 1 ? "" : "s"} successfully.`);
      setQuestionsImported(true);

      toast({
        title: "Questions imported",
        description: `Inserted ${created} new question${created === 1 ? "" : "s"} into the topic.`,
      });
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message || "Unable to import questions",
        variant: "destructive",
      });
    } finally {
      setImportingQuestions(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/ai-tasks">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to tasks
          </Button>
        </Link>
        <Badge variant={statusVariant(task.status)}>{task.status.replace(/_/g, " ")}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{task.label}</CardTitle>
          <p className="text-sm text-muted-foreground">{formatType(task.type)}</p>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDateTime(task.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Started</span>
              <span>{formatDateTime(task.startedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span>{formatDateTime(task.completedAt)}</span>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {task.errorMessage && (
              <div className="text-destructive">
                <span className="font-medium">Error:</span> {task.errorMessage}
              </div>
            )}
            {importSummary && (
              <div className="rounded-md bg-muted/40 p-3 text-sm text-foreground">
                {importSummary}
              </div>
            )}
            {importedQuizId && (
              <Link href={`/admin/quizzes/${importedQuizId}/edit`} className="inline-flex items-center text-sm text-primary hover:underline">
                <Sparkles className="mr-1 h-4 w-4" />
                View imported quiz
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {quizPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Quiz</span>
              <Button
                onClick={handleImportQuiz}
                disabled={!isCompleted || importingQuiz || !normalizedQuiz || Boolean(importedQuizId)}
              >
                {importingQuiz ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : importedQuizId ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Imported
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Import Quiz
                  </>
                )}
              </Button>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Import this AI-generated quiz directly into your quiz library.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {normalizedQuiz ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <SummaryItem label="Title" value={normalizedQuiz.title} />
                  <SummaryItem label="Difficulty" value={normalizedQuiz.difficulty} />
                  <SummaryItem label="Questions" value={normalizedQuizQuestions.length} />
                  <SummaryItem label="Sport" value={normalizedQuiz.sport} />
                  <SummaryItem
                    label="Passing Score"
                    value={`${normalizedQuiz.passingScore}%`}
                  />
                  {normalizedQuiz.duration && (
                    <SummaryItem label="Duration" value={`${normalizedQuiz.duration} sec`} />
                  )}
                </div>
                <QuestionPreviewList questions={normalizedQuizQuestions} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                The AI response did not contain structured quiz data. Review the raw JSON output below.
              </p>
            )}
            <Separator />
            <RawJsonViewer data={quizPreview} label="View raw AI quiz JSON" />
          </CardContent>
        </Card>
      )}

      {questionPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generated Questions ({questionPreviewList.length})</span>
              <Button
                onClick={handleImportQuestions}
                disabled={
                  !isCompleted ||
                  importingQuestions ||
                  questionPreviewList.length === 0 ||
                  questionsImported
                }
              >
                {importingQuestions ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : questionsImported ? (
                  <>
                    <ListChecks className="mr-2 h-4 w-4" />
                    Imported
                  </>
                ) : (
                  <>
                    <ListChecks className="mr-2 h-4 w-4" />
                    Import Questions
                  </>
                )}
              </Button>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Review and import these AI-generated questions into the topic.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {questionPreviewList.length > 0 ? (
              <QuestionPreviewList questions={questionPreviewList} />
            ) : (
              <p className="text-sm text-muted-foreground">
                The AI output did not include valid multiple-choice answers. Check the raw JSON below.
              </p>
            )}
            <Separator />
            <RawJsonViewer data={questionPreview} label="View raw AI question JSON" />
          </CardContent>
        </Card>
      )}

      {!quizPreview && !questionPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Task payload</CardTitle>
          </CardHeader>
          <CardContent>
            <RawJsonViewer data={task.result ?? task.input} label="View raw task JSON" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
