"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FormDescription,
} from "@/components/ui/form";
import { QuizInput, quizSchema } from "@/lib/validations/quiz.schema";
import { Difficulty, QuizStatus } from "@prisma/client";
import { generateSlug } from "@/lib/slug-utils";
import { CollapsibleSection } from "@/components/admin/quiz/StreamlinedQuizForm";
import { TopicSelector } from "@/components/admin/TopicSelector";

interface RootTopic {
  id: string;
  name: string;
}

export default function NewQuizPage() {
  const router = useRouter();
  const { toast } = useToast();
  const slugManuallyEditedRef = useRef(false);
  const [sports, setSports] = useState<RootTopic[]>([]);
  const [loadingSports, setLoadingSports] = useState(true);

  // Fetch root topics (level 0) for sport dropdown
  useEffect(() => {
    async function fetchSports() {
      try {
        const response = await fetch("/api/topics");
        if (response.ok) {
          const result = await response.json();
          const rootTopics = result.data?.topics?.filter((t: any) => t.parentId === null) || [];
          setSports(rootTopics);
        }
      } catch (error) {
        console.error("Failed to fetch sports:", error);
      } finally {
        setLoadingSports(false);
      }
    }
    fetchSports();
  }, []);

  const form = useForm({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      sport: "",
      difficulty: Difficulty.MEDIUM,
      status: QuizStatus.DRAFT,
      duration: 600,
      passingScore: 70,
      completionBonus: 0,
      isFeatured: false,
      // Advanced fields with defaults
      questionSelectionMode: "FIXED",
      questionCount: undefined,
      randomizeQuestionOrder: false,
      showHints: true,
      maxAttemptsPerUser: null,
      attemptResetPeriod: "NEVER",
      recurringType: "NONE",
      // Scoring defaults
      negativeMarkingEnabled: false,
      penaltyPercentage: 25,
      timeBonusEnabled: false,
      bonusPointsPerSecond: 0,
      // Optional fields
      descriptionImageUrl: "",
      startTime: "",
      endTime: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: [],
    },
  });

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
      title: values.title,
      slug: values.slug,
      description: values.description,
      sport: values.sport,
      difficulty: values.difficulty,
      status: values.status,
      duration: values.duration ?? 600,
      passingScore: values.passingScore ?? 70,
      completionBonus: values.completionBonus ?? 0,
      isFeatured: values.isFeatured,
      isPublished: values.isPublished ?? false,
      // Advanced fields
      questionSelectionMode: values.questionSelectionMode,
      questionCount: values.questionCount,
      randomizeQuestionOrder: values.randomizeQuestionOrder,
      showHints: values.showHints,
      maxAttemptsPerUser: values.maxAttemptsPerUser,
      attemptResetPeriod: values.attemptResetPeriod,
      recurringType: values.recurringType,
      negativeMarkingEnabled: values.negativeMarkingEnabled,
      penaltyPercentage: values.penaltyPercentage,
      timeBonusEnabled: values.timeBonusEnabled,
      bonusPointsPerSecond: values.bonusPointsPerSecond,
      // Optional
      descriptionImageUrl: values.descriptionImageUrl || undefined,
      startTime: values.startTime || undefined,
      endTime: values.endTime || undefined,
      seoTitle: values.seoTitle || undefined,
      seoDescription: values.seoDescription || undefined,
      seoKeywords: values.seoKeywords?.filter((k: string) => k.trim().length > 0) || undefined,
    };

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
    <div className="relative min-h-screen">
      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/quizzes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Create New Quiz</h1>
          </div>
          <Button
            type="submit"
            form="quiz-form"
            disabled={isSubmitting}
            size="default"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Creating..." : "Create Quiz"}
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <Form {...form}>
          <form id="quiz-form" onSubmit={onSubmit} className="space-y-4 pb-32">
            {/* Essential Fields - Always Visible */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
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
                            placeholder="auto-generated"
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
                        <Textarea {...field} rows={2} placeholder="Brief description" />
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
                          <TopicSelector
                            topics={sports}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={loadingSports ? "Loading..." : "Select sport (root topic)"}
                            disabled={loadingSports}
                            valueKey="name"
                          />
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
                        <FormLabel>Difficulty</FormLabel>
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
                        <FormLabel>Status</FormLabel>
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
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Settings - Always Visible */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
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
                            placeholder="seconds"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Total quiz time</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Passing Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="passingScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={field.value}
                            onChange={(event) => field.onChange(Number(event.target.value))}
                            placeholder="70"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">Percentage</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Featured</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                            <label className="text-sm">Show on homepage</label>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Advanced Sections - Collapsible */}
            <CollapsibleSection title="Question Selection" description="How questions are added to attempts">
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
                          <SelectItem value="FIXED">Fixed Order</SelectItem>
                          <SelectItem value="TOPIC_RANDOM">Topic Random</SelectItem>
                          <SelectItem value="POOL_RANDOM">Pool Random</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="questionCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Count (Optional)</FormLabel>
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
                      <FormLabel>Randomize Order</FormLabel>
                      <FormDescription className="text-xs">
                        Shuffle questions each time
                      </FormDescription>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                      <FormDescription className="text-xs">
                        Reveal hints on questions
                      </FormDescription>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormItem>
                )}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Scoring" description="Configure scoring rules">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="completionBonus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Completion Bonus</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        One-time bonus awarded on first pass. Also caps zero-time per-question total.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="negativeMarkingEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>Negative Marking</FormLabel>
                      <FormDescription className="text-xs">
                        Deduct points for wrong answers
                      </FormDescription>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="penaltyPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Penalty %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bonusPointsPerSecond"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bonus per Second</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step="0.1"
                          value={field.value}
                          onChange={(event) => field.onChange(Number(event.target.value))}
                        />
                      </FormControl>
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
                      <FormLabel>Time Bonus</FormLabel>
                      <FormDescription className="text-xs">
                        Reward fast answers
                      </FormDescription>
                    </div>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormItem>
                )}
              />
            </CollapsibleSection>

            <CollapsibleSection title="SEO" description="Search engine optimization">
              <FormField
                control={form.control}
                name="seoTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Title (max 60 chars)</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={60} placeholder="Custom title for search" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seoDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Description (max 160 chars)</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={2} maxLength={160} placeholder="Description for search results" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="seoKeywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value?.join(", ") ?? ""}
                        onChange={(event) => {
                          const keywords = event.target.value
                            .split(",")
                            .map((k) => k.trim())
                            .filter((k) => k.length > 0);
                          field.onChange(keywords);
                        }}
                        placeholder="nba, basketball, champions"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CollapsibleSection>
          </form>
        </Form>
      </div>
    </div>
  );
}