"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/shared/PageHeader";
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { QuizInput, quizSchema } from "@/lib/validations/quiz.schema";
import {
  Difficulty,
  QuizStatus,
  QuestionSelectionMode,
  RecurringType,
} from "@prisma/client";
import {
  AttemptResetPeriod,
  ATTEMPT_RESET_PERIOD_OPTIONS,
} from "@/constants/attempts";
import { generateSlug } from "@/lib/seo-utils";

export default function NewQuizPage() {
  const router = useRouter();
  const { toast } = useToast();
  const slugManuallyEditedRef = useRef(false);

  const form = useForm({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      descriptionImageUrl: "",
      descriptionVideoUrl: "",
      sport: "",
      difficulty: Difficulty.MEDIUM,
      status: QuizStatus.DRAFT,
      duration: undefined,
      timePerQuestion: undefined,
      passingScore: 70,
      questionSelectionMode: QuestionSelectionMode.FIXED,
      questionCount: undefined,
      randomizeQuestionOrder: false,
      showHints: true,
      negativeMarkingEnabled: false,
      penaltyPercentage: 25,
      timeBonusEnabled: false,
      bonusPointsPerSecond: 0,
      startTime: "",
      endTime: "",
      answersRevealTime: "",
      recurringType: RecurringType.NONE,
      maxAttemptsPerUser: null,
      attemptResetPeriod: AttemptResetPeriod.NEVER,
      isFeatured: false,
      isPublished: false,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: [],
    },
  });

  const attemptResetOptions = ATTEMPT_RESET_PERIOD_OPTIONS;

  const attemptLimitEnabled = form.watch("maxAttemptsPerUser") !== null;
  const attemptResetPeriodValue = form.watch("attemptResetPeriod");
  const recurringTypeValue = form.watch("recurringType");

  const handleAttemptLimitToggle = (checked: boolean) => {
    if (checked) {
      form.setValue("maxAttemptsPerUser", 3, { shouldDirty: true });
      if (recurringTypeValue === RecurringType.NONE) {
        form.setValue("attemptResetPeriod", AttemptResetPeriod.NEVER, { shouldDirty: false });
      }
    } else {
      form.setValue("maxAttemptsPerUser", null, { shouldDirty: true });
      form.setValue("attemptResetPeriod", AttemptResetPeriod.NEVER, { shouldDirty: true });
    }
  };

  const titleValue = form.watch("title");
  const slugValue = form.watch("slug");

  useEffect(() => {
    if (!titleValue) {
      if (!slugManuallyEditedRef.current) {
        form.setValue("slug", "", { shouldDirty: false });
      }
      return;
    }

    if (!slugManuallyEditedRef.current || !slugValue) {
      const nextSlug = generateSlug(titleValue);
      form.setValue("slug", nextSlug, {
        shouldDirty: !slugManuallyEditedRef.current,
        shouldValidate: true,
      });
    }
  }, [form, slugValue, titleValue]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload: QuizInput = {
      ...values,
      duration: values.duration ?? undefined,
      timePerQuestion: values.timePerQuestion ?? undefined,
      questionCount: values.questionCount ?? undefined,
      seoKeywords: values.seoKeywords?.filter((keyword) => keyword.trim().length > 0),
      startTime: values.startTime || undefined,
      endTime: values.endTime || undefined,
      answersRevealTime: values.answersRevealTime || undefined,
    };

    if (payload.maxAttemptsPerUser == null) {
      payload.maxAttemptsPerUser = null;
      payload.attemptResetPeriod = AttemptResetPeriod.NEVER;
    } else {
      payload.attemptResetPeriod =
        payload.recurringType === RecurringType.NONE
          ? AttemptResetPeriod.NEVER
          : payload.attemptResetPeriod ?? AttemptResetPeriod.NEVER;
    }

    try {
      const response = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create quiz");
      }

      toast({
        title: "Quiz created!",
        description: `${values.title} has been created successfully.`,
      });

      router.push(`/admin/quizzes/${result.data.id}/edit`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div>
      <PageHeader
        title="Create New Quiz"
        description="Add a new quiz to your collection"
        action={
          <Link href="/admin/quizzes">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Quizzes
            </Button>
          </Link>
        }
      />

      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential quiz details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., NBA Champions Quiz" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          onChange={(event) => {
                            const value = event.target.value;
                            slugManuallyEditedRef.current = value.length > 0;
                            field.onChange(value);
                          }}
                          placeholder="e.g., nba-champions-quiz"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} placeholder="Brief description of the quiz" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="sport"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sport</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Basketball" />
                      </FormControl>
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

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={QuizStatus.DRAFT}>Draft</SelectItem>
                          <SelectItem value={QuizStatus.REVIEW}>Review</SelectItem>
                          <SelectItem value={QuizStatus.PUBLISHED}>Published</SelectItem>
                          <SelectItem value={QuizStatus.ARCHIVED}>Archived</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiz Configuration</CardTitle>
              <CardDescription>Time limits and passing criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (seconds)</FormLabel>
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timePerQuestion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time per Question (seconds)</FormLabel>
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passingScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passing Score (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
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
              <CardTitle>Question Selection</CardTitle>
              <CardDescription>How questions are added to each attempt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="questionSelectionMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selection Mode</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={QuestionSelectionMode.FIXED}>Fixed order</SelectItem>
                          <SelectItem value={QuestionSelectionMode.TOPIC_RANDOM}>
                            Topic based random
                          </SelectItem>
                          <SelectItem value={QuestionSelectionMode.POOL_RANDOM}>
                            Pool random
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="questionCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Count (optional)</FormLabel>
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="randomizeQuestionOrder"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>Randomize Question Order</FormLabel>
                      <CardDescription>Shuffle questions each time the quiz runs.</CardDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="showHints"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>Show Hints</FormLabel>
                      <CardDescription>Reveal hints when configured on questions.</CardDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scoring</CardTitle>
              <CardDescription>Fine tune the scoring model</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="negativeMarkingEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>Enable Negative Marking</FormLabel>
                      <CardDescription>Deduct points for incorrect answers.</CardDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="penaltyPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Penalty Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bonusPointsPerSecond"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonus Points per Second</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.1"
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="timeBonusEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>Enable Time Bonus</FormLabel>
                      <CardDescription>Reward fast answers when bonus is configured.</CardDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scheduling</CardTitle>
              <CardDescription>Control when the quiz is available</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="answersRevealTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Answers Reveal Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={field.value ?? ""}
                          onChange={(event) => field.onChange(event.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="recurringType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recurring Schedule</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={RecurringType.NONE}>One-time</SelectItem>
                        <SelectItem value={RecurringType.HOURLY}>Hourly</SelectItem>
                        <SelectItem value={RecurringType.DAILY}>Daily</SelectItem>
                        <SelectItem value={RecurringType.WEEKLY}>Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
              <CardDescription>Control how the quiz appears on the site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>Feature this Quiz</FormLabel>
                      <CardDescription>Include in the featured carousel for players.</CardDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
              <CardDescription>Improve how this quiz appears in search results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="seoTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Custom title for search engines" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seoDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Short summary for search engines"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seoKeywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Keywords</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value?.join(", ") ?? ""}
                        onChange={(event) => {
                          const nextValue = event.target.value
                            .split(",")
                            .map((keyword) => keyword.trim())
                            .filter((keyword) => keyword.length > 0);
                          field.onChange(nextValue);
                        }}
                        placeholder="Comma separated keywords"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "Creating..." : "Create Quiz"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
