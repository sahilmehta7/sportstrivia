"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, CheckCircle, Sparkles, Loader2 } from "lucide-react";
import { questionSchema, answerSchema } from "@/lib/validations/question.schema";
import { Difficulty, QuestionType } from "@prisma/client";
import { useToast } from "@/hooks/use-toast";

const questionFormSchema = questionSchema.extend({
  answers: z
    .array(
      answerSchema.extend({
        id: z.string().cuid().optional(),
      })
    )
    .min(2, "At least 2 answers required"),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

interface QuestionEditorProps {
  initialData?: any;
  topics: any[];
  onSave: (data: QuestionFormValues) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function QuestionEditor({
  initialData,
  topics,
  onSave,
  onCancel,
  saving = false,
}: QuestionEditorProps) {
  const { toast } = useToast();
  const [aiFixing, setAiFixing] = useState(false);
  const defaultAnswers =
    initialData?.answers?.map((answer: any, index: number) => ({
      id: answer.id,
      answerText: answer.answerText ?? "",
      answerImageUrl: answer.answerImageUrl ?? "",
      answerVideoUrl: answer.answerVideoUrl ?? "",
      answerAudioUrl: answer.answerAudioUrl ?? "",
      isCorrect: answer.isCorrect ?? index === 0,
      displayOrder: answer.displayOrder ?? index,
    })) ??
    [
      { answerText: "", isCorrect: true, displayOrder: 0 },
      { answerText: "", isCorrect: false, displayOrder: 1 },
      { answerText: "", isCorrect: false, displayOrder: 2 },
      { answerText: "", isCorrect: false, displayOrder: 3 },
    ];

  const form = useForm({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      type: initialData?.type ?? QuestionType.MULTIPLE_CHOICE,
      topicId: initialData?.topicId ?? "",
      difficulty: initialData?.difficulty ?? Difficulty.MEDIUM,
      questionText: initialData?.questionText ?? "",
      questionImageUrl: initialData?.questionImageUrl ?? "",
      questionVideoUrl: initialData?.questionVideoUrl ?? "",
      questionAudioUrl: initialData?.questionAudioUrl ?? "",
      hint: initialData?.hint ?? "",
      explanation: initialData?.explanation ?? "",
      explanationImageUrl: initialData?.explanationImageUrl ?? "",
      explanationVideoUrl: initialData?.explanationVideoUrl ?? "",
      randomizeAnswerOrder: initialData?.randomizeAnswerOrder ?? false,
      timeLimit:
        typeof initialData?.timeLimit === "number" ? Number(initialData?.timeLimit) : undefined,
      answers: defaultAnswers,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "answers",
  });

  const answers = form.watch("answers");
  const correctAnswerIndex = answers.findIndex((answer) => answer.isCorrect);

  const answersErrorMessage = useMemo(() => {
    const error = form.formState.errors.answers as any;
    if (!error) return undefined;
    if (Array.isArray(error)) {
      return error.find((item) => item?.message)?.message;
    }
    return error?.message ?? error?.root?.message ?? error?._errors?.[0];
  }, [form.formState.errors.answers]);

  useEffect(() => {
    if (answers.length === 0) {
      append({
        answerText: "",
        isCorrect: true,
        displayOrder: 0,
      });
    }
  }, [answers.length, append]);

  const handleAddAnswer = () => {
    append({
      answerText: "",
      isCorrect: false,
      displayOrder: fields.length,
    });
  };

  const handleRemoveAnswer = (index: number) => {
    if (fields.length <= 2) return;
    remove(index);

    const remainingAnswers = form.getValues("answers");
    if (remainingAnswers.every((answer) => !answer.isCorrect) && remainingAnswers.length > 0) {
      form.setValue("answers.0.isCorrect", true, { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleMarkCorrect = (index: number) => {
    answers.forEach((_, answerIndex) => {
      form.setValue(`answers.${answerIndex}.isCorrect`, answerIndex === index, {
        shouldDirty: true,
        shouldValidate: true,
      });
    });
  };

  const submitQuestion = form.handleSubmit(async (values) => {
    form.clearErrors("root");

    const normalizedAnswers = values.answers.map((answer, index) => ({
      ...answer,
      displayOrder: index,
    }));

    try {
      await onSave({ ...values, answers: normalizedAnswers });
    } catch (error: any) {
      form.setError("root", {
        message: error?.message || "Failed to save question. Please try again.",
      });
    }
  });

  const handleAIFix = async () => {
    const currentValues = form.getValues();

    if (!currentValues.questionText.trim()) {
      toast({
        title: "Question text required",
        description: "Please enter a question before using AI fix.",
        variant: "destructive",
      });
      return;
    }

    const validAnswers = currentValues.answers.filter(a => a.answerText?.trim());
    if (validAnswers.length < 2) {
      toast({
        title: "More answers needed",
        description: "Please add at least 2 answers before using AI fix.",
        variant: "destructive",
      });
      return;
    }

    setAiFixing(true);

    try {
      // Get topic name for context
      const selectedTopic = topics.find(t => t.id === currentValues.topicId);

      const response = await fetch("/api/admin/questions/ai/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: currentValues.questionText,
          answers: currentValues.answers.map(a => ({
            answerText: a.answerText || "",
            isCorrect: a.isCorrect,
          })),
          difficulty: currentValues.difficulty,
          hint: currentValues.hint,
          explanation: currentValues.explanation,
          topicName: selectedTopic?.name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to get AI suggestions");
      }

      // Update form with AI-improved content
      const improved = result.data;

      form.setValue("questionText", improved.questionText, { shouldDirty: true });

      if (improved.hint) {
        form.setValue("hint", improved.hint, { shouldDirty: true });
      }

      if (improved.explanation) {
        form.setValue("explanation", improved.explanation, { shouldDirty: true });
      }

      // Update answers - maintain existing IDs and URLs
      if (Array.isArray(improved.answers)) {
        const currentAnswers = form.getValues("answers");
        improved.answers.forEach((improvedAnswer: any, index: number) => {
          if (index < currentAnswers.length) {
            form.setValue(`answers.${index}.answerText`, improvedAnswer.answerText, { shouldDirty: true });
            form.setValue(`answers.${index}.isCorrect`, improvedAnswer.isCorrect, { shouldDirty: true });
          }
        });
      }

      toast({
        title: "AI suggestions applied!",
        description: "Review the improvements and save when ready.",
      });
    } catch (error: any) {
      toast({
        title: "AI fix failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAiFixing(false);
    }
  };

  const rootError = form.formState.errors.root?.message;

  return (
    <Form {...form}>
      <form onSubmit={submitQuestion} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Question Details</CardTitle>
              <CardDescription>Basic question information</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAIFix}
              disabled={aiFixing}
              className="gap-2"
            >
              {aiFixing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  AI Fix
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question Type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={QuestionType.MULTIPLE_CHOICE}>Multiple Choice</SelectItem>
                        <SelectItem value={QuestionType.FILL_BLANK}>Fill in the Blank</SelectItem>
                        <SelectItem value={QuestionType.FLASHCARD}>Flashcard</SelectItem>
                        <SelectItem value={QuestionType.IMAGE_BASED}>Image Based</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="topicId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {topics.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {`${"— ".repeat(topic.level ?? 0)}${topic.name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={Difficulty.EASY}>Easy</SelectItem>
                        <SelectItem value={Difficulty.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={Difficulty.HARD}>Hard</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="questionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Text *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter your question here..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="questionImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://..."
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="questionVideoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://..."
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="questionAudioUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audio URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://..."
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Answer Options</CardTitle>
            <CardDescription>
              At least 2 answers required. Mark exactly one as correct.
              {correctAnswerIndex >= 0 && (
                <Badge variant="default" className="ml-2">
                  Answer {String.fromCharCode(65 + correctAnswerIndex)} is correct
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <label className="text-base font-semibold">
                    Answer {String.fromCharCode(65 + index)}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={answers[index]?.isCorrect ?? false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleMarkCorrect(index);
                          }
                        }}
                      />
                      <span className="text-sm">
                        {answers[index]?.isCorrect ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Correct
                          </span>
                        ) : (
                          "Mark as correct"
                        )}
                      </span>
                    </div>
                    {fields.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAnswer(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name={`answers.${index}.answerText`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="Answer text..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-3 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name={`answers.${index}.answerImageUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="Image URL (optional)"
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`answers.${index}.answerVideoUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="Video URL (optional)"
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`answers.${index}.answerAudioUrl`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="Audio URL (optional)"
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}

            {answersErrorMessage && (
              <p className="text-sm font-medium text-destructive">{answersErrorMessage}</p>
            )}

            <Button type="button" variant="outline" onClick={handleAddAnswer} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Answer Option
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hints &amp; Explanation</CardTitle>
            <CardDescription>Help users learn from the question</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="hint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hint (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} placeholder="A helpful hint for users..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="explanation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Explanation (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Explain the correct answer..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="explanationImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explanation Image URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://..."
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="explanationVideoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explanation Video URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://..."
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>Optional question-specific configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="randomizeAnswerOrder"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>Randomize Answer Order</FormLabel>
                    <CardDescription>Shuffle answer options for each quiz attempt.</CardDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timeLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time Limit (seconds)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === "" ? undefined : Number(event.target.value)
                        )
                      }
                      placeholder="Optional - overrides quiz-level timing"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {rootError && (
          <p className="text-sm font-medium text-destructive" role="alert">
            {rootError}
          </p>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : initialData ? "Update Question" : "Create Question"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

