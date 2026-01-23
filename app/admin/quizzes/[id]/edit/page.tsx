"use client";

import React, { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Save,
  Trash2,
  CheckCircle,
  Archive,
  EyeOff,
  Upload as UploadIcon,
  X,
  Sparkles,
  Wand2,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AttemptResetPeriod,
  ATTEMPT_RESET_PERIOD_OPTIONS,
  ATTEMPT_RESET_PERIOD_LABELS,
  ATTEMPT_RESET_PERIOD_HELP_TEXT,
} from "@/constants/attempts";
import type { AttemptResetPeriodValue } from "@/constants/attempts";
import { regenerateQuizSEOAction } from "../../actions";

interface EditQuizPageProps {
  params: Promise<{ id: string }>;
}

export default function EditQuizPage({ params }: EditQuizPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [quizId, setQuizId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [topicConfigs, setTopicConfigs] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiMetadataLoading, setAiMetadataLoading] = useState(false);
  const [aiMetadataSuggestion, setAiMetadataSuggestion] = useState<{ title: string; description: string } | null>(null);
  const [aiCoverLoading, setAiCoverLoading] = useState(false);
  const [seoRegenerating, setSeoRegenerating] = useState(false);
  const [attemptLimitEnabled, setAttemptLimitEnabled] = useState(false);
  const attemptResetOptions = ATTEMPT_RESET_PERIOD_OPTIONS;

  interface RootTopic {
    id: string;
    name: string;
  }
  const [sports, setSports] = useState<RootTopic[]>([]);
  const [loadingSports, setLoadingSports] = useState(true);

  // Fetch root topics (level 0) to use as sports list
  useEffect(() => {
    async function fetchSports() {
      try {
        const response = await fetch("/api/topics");
        if (response.ok) {
          const data = await response.json();
          const rootTopics = data.topics?.filter((t: any) => t.parentId === null) || [];
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

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    descriptionImageUrl: "",
    sport: "",
    difficulty: "MEDIUM",
    status: "DRAFT",
    duration: "",
    timePerQuestion: "",
    passingScore: "70",
    completionBonus: "0",
    questionSelectionMode: "FIXED",
    questionCount: "",
    randomizeQuestionOrder: false,
    showHints: true,
    negativeMarkingEnabled: false,
    penaltyPercentage: "25",
    timeBonusEnabled: false,
    bonusPointsPerSecond: "0",
    startTime: "",
    endTime: "",
    answersRevealTime: "",
    recurringType: "NONE",
    maxAttemptsPerUser: "",
    attemptResetPeriod: "NEVER",
    isFeatured: false,
    isPublished: false,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });

  const maxAttemptsValue = formData.maxAttemptsPerUser
    ? Number.parseInt(formData.maxAttemptsPerUser, 10)
    : null;
  const attemptResetPeriodValue = formData.attemptResetPeriod as AttemptResetPeriodValue;
  const _canConfigureReset = attemptLimitEnabled && formData.recurringType !== "NONE";
  const attemptResetLabel = ATTEMPT_RESET_PERIOD_LABELS[attemptResetPeriodValue];
  const attemptResetHelpText = ATTEMPT_RESET_PERIOD_HELP_TEXT[attemptResetPeriodValue];
  const attemptLimitSummary = attemptLimitEnabled
    ? maxAttemptsValue && maxAttemptsValue > 0
      ? attemptResetPeriodValue === AttemptResetPeriod.NEVER
        ? `Limited to ${maxAttemptsValue} attempt${maxAttemptsValue === 1 ? "" : "s"} total`
        : `Limited to ${maxAttemptsValue} attempt${maxAttemptsValue === 1 ? "" : "s"} per ${attemptResetLabel.toLowerCase()}`
      : "Enter a limit to enforce the cap."
    : "Unlimited attempts";

  useEffect(() => {
    async function loadQuiz() {
      const resolvedParams = await params;
      setQuizId(resolvedParams.id);

      try {
        const response = await fetch(`/api/admin/quizzes/${resolvedParams.id}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to load quiz");
        }

        const quiz = result.data;

        // Format dates for datetime-local input
        const formatDateTime = (date: string | null) => {
          if (!date) return "";
          return new Date(date).toISOString().slice(0, 16);
        };

        setFormData({
          title: quiz.title || "",
          slug: quiz.slug || "",
          description: quiz.description || "",
          descriptionImageUrl: quiz.descriptionImageUrl || "",
          sport: quiz.sport || "",
          difficulty: quiz.difficulty || "MEDIUM",
          status: quiz.status || "DRAFT",
          duration: quiz.duration?.toString() || "",
          timePerQuestion: quiz.timePerQuestion?.toString() || "",
          passingScore: quiz.passingScore?.toString() || "70",
          completionBonus: (quiz.completionBonus ?? 0).toString(),
          questionSelectionMode: quiz.questionSelectionMode || "FIXED",
          questionCount: quiz.questionCount?.toString() || "",
          randomizeQuestionOrder: quiz.randomizeQuestionOrder || false,
          showHints: quiz.showHints ?? true,
          negativeMarkingEnabled: quiz.negativeMarkingEnabled || false,
          penaltyPercentage: quiz.penaltyPercentage?.toString() || "25",
          timeBonusEnabled: quiz.timeBonusEnabled || false,
          bonusPointsPerSecond: quiz.bonusPointsPerSecond?.toString() || "0",
          startTime: formatDateTime(quiz.startTime),
          endTime: formatDateTime(quiz.endTime),
          answersRevealTime: formatDateTime(quiz.answersRevealTime),
          recurringType: quiz.recurringType || "NONE",
          maxAttemptsPerUser: quiz.maxAttemptsPerUser?.toString() || "",
          attemptResetPeriod: quiz.attemptResetPeriod || "NEVER",
          isFeatured: quiz.isFeatured || false,
          isPublished: quiz.isPublished || false,
          seoTitle: quiz.seoTitle || "",
          seoDescription: quiz.seoDescription || "",
          seoKeywords: quiz.seoKeywords?.join(", ") || "",
        });
        setAttemptLimitEnabled(Boolean(quiz.maxAttemptsPerUser));

        // Load topic configurations if TOPIC_RANDOM mode
        if (quiz.questionSelectionMode === "TOPIC_RANDOM") {
          try {
            const topicResponse = await fetch(`/api/admin/quizzes/${resolvedParams.id}/topics`);
            const topicResult = await topicResponse.json();
            if (topicResponse.ok) {
              setTopicConfigs(topicResult.data.topicConfigs || []);
            }
          } catch (error) {
            // Silently fail - topic configs are optional
            console.error("Failed to load topic configs:", error);
          }
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        router.push("/admin/quizzes");
      } finally {
        setLoading(false);
      }
    }

    loadQuiz();
  }, [params, router, toast]);

  // Load topic configs when switching to TOPIC_RANDOM mode
  useEffect(() => {
    async function loadTopicConfigs() {
      if (formData.questionSelectionMode === "TOPIC_RANDOM" && quizId) {
        try {
          const topicResponse = await fetch(`/api/admin/quizzes/${quizId}/topics`);
          const topicResult = await topicResponse.json();
          if (topicResponse.ok) {
            setTopicConfigs(topicResult.data.topicConfigs || []);
          }
        } catch (error) {
          console.error("Failed to load topic configs:", error);
        }
      }
    }

    loadTopicConfigs();
  }, [formData.questionSelectionMode, quizId]);

  useEffect(() => {
    if (
      formData.recurringType === "NONE" &&
      formData.attemptResetPeriod !== AttemptResetPeriod.NEVER
    ) {
      setFormData((prev) => ({
        ...prev,
        attemptResetPeriod: AttemptResetPeriod.NEVER,
      }));
    }
  }, [formData.recurringType, formData.attemptResetPeriod]);

  // Auto-calculate total duration when timePerQuestion is set
  useEffect(() => {
    if (!formData.timePerQuestion || !topicConfigs) return;

    const timePerQ = parseInt(formData.timePerQuestion);
    if (isNaN(timePerQ) || timePerQ <= 0) return;

    let questionCount = 0;

    if (formData.questionSelectionMode === "TOPIC_RANDOM") {
      // Sum up question counts from all topic configs
      questionCount = topicConfigs.reduce((sum: number, config: any) => sum + (config.questionCount || 0), 0);
    } else if (formData.questionSelectionMode === "POOL_RANDOM") {
      // Use the specified questionCount
      questionCount = parseInt(formData.questionCount) || 0;
    }

    if (questionCount > 0) {
      const calculatedDuration = questionCount * timePerQ;
      setFormData((prev) => ({
        ...prev,
        duration: calculatedDuration.toString(),
      }));
    }
  }, [formData.timePerQuestion, formData.questionCount, formData.questionSelectionMode, topicConfigs]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Prepare data
      const parsedMaxAttempts =
        attemptLimitEnabled && formData.maxAttemptsPerUser
          ? parseInt(formData.maxAttemptsPerUser, 10)
          : null;

      const normalizedMaxAttempts =
        parsedMaxAttempts !== null && !Number.isNaN(parsedMaxAttempts)
          ? Math.max(parsedMaxAttempts, 1)
          : null;

      const effectiveResetPeriod =
        formData.recurringType === "NONE"
          ? AttemptResetPeriod.NEVER
          : formData.attemptResetPeriod;

      const data = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : null,
        timePerQuestion: formData.timePerQuestion ? parseInt(formData.timePerQuestion) : null,
        passingScore: parseInt(formData.passingScore),
        completionBonus: parseInt(formData.completionBonus),
        questionCount: formData.questionCount ? parseInt(formData.questionCount) : null,
        penaltyPercentage: parseInt(formData.penaltyPercentage),
        bonusPointsPerSecond: parseFloat(formData.bonusPointsPerSecond),
        seoKeywords: formData.seoKeywords ? formData.seoKeywords.split(",").map(k => k.trim()) : [],
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        answersRevealTime: formData.answersRevealTime || undefined,
        maxAttemptsPerUser: normalizedMaxAttempts,
        attemptResetPeriod:
          normalizedMaxAttempts && normalizedMaxAttempts > 0
            ? effectiveResetPeriod
            : AttemptResetPeriod.NEVER,
      };

      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update quiz");
      }

      toast({
        title: "Quiz updated!",
        description: `${formData.title} has been updated successfully.`,
      });

      router.push("/admin/quizzes");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete quiz");
      }

      toast({
        title: "Quiz deleted!",
        description: "The quiz has been archived successfully.",
      });

      router.push("/admin/quizzes");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handlePublish = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PUBLISHED",
          isPublished: true
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to publish quiz");
      }

      setFormData(prev => ({
        ...prev,
        status: "PUBLISHED",
        isPublished: true
      }));

      toast({
        title: "Quiz published!",
        description: "The quiz is now live and visible to users.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "DRAFT",
          isPublished: false
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to unpublish quiz");
      }

      setFormData(prev => ({
        ...prev,
        status: "DRAFT",
        isPublished: false
      }));

      toast({
        title: "Quiz unpublished!",
        description: "The quiz has been moved back to draft status.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ARCHIVED",
          isPublished: false
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to archive quiz");
      }

      setFormData(prev => ({
        ...prev,
        status: "ARCHIVED",
        isPublished: false
      }));

      toast({
        title: "Quiz archived!",
        description: "The quiz is no longer visible to users.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAttemptLimitToggle = (checked: boolean) => {
    setAttemptLimitEnabled(checked);
    if (checked) {
      if (!formData.maxAttemptsPerUser) {
        updateField("maxAttemptsPerUser", "3");
      }
      if (formData.recurringType === "NONE") {
        updateField("attemptResetPeriod", AttemptResetPeriod.NEVER);
      }
    } else {
      updateField("maxAttemptsPerUser", "");
      updateField("attemptResetPeriod", AttemptResetPeriod.NEVER);
    }
  };

  const handleGenerateMetadata = async () => {
    if (!quizId) return;
    setAiMetadataLoading(true);
    setAiMetadataSuggestion(null);

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/ai/metadata`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate suggestion");
      }

      setAiMetadataSuggestion({
        title: result.data.title,
        description: result.data.description,
      });

      toast({
        title: "AI suggestion ready",
        description: "Review the regenerated title and description below.",
      });
    } catch (error: any) {
      toast({
        title: "AI request failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAiMetadataLoading(false);
    }
  };

  const handleAcceptMetadataSuggestion = () => {
    if (!aiMetadataSuggestion) return;

    updateField("title", aiMetadataSuggestion.title);
    updateField("description", aiMetadataSuggestion.description);
    setAiMetadataSuggestion(null);

    toast({
      title: "Suggestion applied",
      description: "Title and description updated.",
    });
  };

  const handleDismissMetadataSuggestion = () => {
    setAiMetadataSuggestion(null);
  };

  const handleGenerateCoverImage = async () => {
    if (!quizId) return;
    setAiCoverLoading(true);

    try {
      const response = await fetch(`/api/admin/quizzes/${quizId}/ai/cover`, {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate cover image");
      }

      updateField("descriptionImageUrl", result.data.url);

      toast({
        title: "Cover image generated",
        description: "A new AI-generated cover image has been applied.",
      });
    } catch (error: any) {
      toast({
        title: "Image generation failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAiCoverLoading(false);
    }
  };

  const handleRegenerateSEO = async () => {
    if (!quizId) return;
    setSeoRegenerating(true);

    try {
      const aiMetadata = await regenerateQuizSEOAction(quizId);

      setFormData((prev) => ({
        ...prev,
        seoTitle: aiMetadata.title,
        seoDescription: aiMetadata.description,
        seoKeywords: aiMetadata.keywords.join(", "),
      }));

      toast({
        title: "SEO regenerated!",
        description: "SEO fields have been updated with AI-optimized content.",
      });
    } catch (error: any) {
      toast({
        title: "SEO regeneration failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSeoRegenerating(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => {
      const updates: any = { [field]: value };

      // Sync isPublished with status changes
      if (field === "status") {
        updates.isPublished = value === "PUBLISHED";
      }
      if (field === "recurringType" && value === "NONE") {
        updates.attemptResetPeriod = AttemptResetPeriod.NEVER;
      }

      return { ...prev, ...updates };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG, PNG, GIF, and WebP images are allowed",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      uploadFormData.append("folder", "quizzes");

      const response = await fetch("/api/admin/upload/image", {
        method: "POST",
        body: uploadFormData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to upload image");
      }

      updateField("descriptionImageUrl", result.data.url);

      toast({
        title: "Image uploaded!",
        description: "Cover image has been uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    updateField("descriptionImageUrl", "");
    toast({
      title: "Image removed",
      description: "Cover image has been removed",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Sticky Action Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/quizzes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-lg font-semibold">Edit: {formData.title || "Quiz"}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/admin/quizzes/${quizId}/questions`}>
              <Button variant="secondary" size="sm">
                Manage Questions
              </Button>
            </Link>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {formData.status !== "PUBLISHED" && (
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handlePublish}
                disabled={saving}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Publish
              </Button>
            )}

            {formData.status === "PUBLISHED" && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleUnpublish}
                  disabled={saving}
                >
                  <EyeOff className="mr-2 h-4 w-4" />
                  Unpublish
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleArchive}
                  disabled={saving}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              </>
            )}

            <Button
              type="submit"
              form="quiz-edit-form"
              size="default"
              disabled={saving}
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <PageHeader
          title={`Edit Quiz: ${formData.title}`}
          description="Update quiz details and configuration"
        />

        <form id="quiz-edit-form" onSubmit={handleSubmit} className="space-y-6 pb-32">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential quiz details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleGenerateMetadata}
                      disabled={aiMetadataLoading || !quizId}
                      className="gap-1.5"
                    >
                      {aiMetadataLoading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Thinking...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Regenerate with AI
                        </>
                      )}
                    </Button>
                  </div>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => updateField("slug", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={3}
                />
              </div>

              {aiMetadataSuggestion && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <Wand2 className="h-4 w-4" />
                        AI suggestion
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{aiMetadataSuggestion.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {aiMetadataSuggestion.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button type="button" onClick={handleAcceptMetadataSuggestion} size="sm" className="gap-1.5">
                      <CheckCircle className="h-4 w-4" />
                      Use suggestion
                    </Button>
                    <Button type="button" variant="outline" onClick={handleDismissMetadataSuggestion} size="sm">
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Add a cover image for your quiz (displayed on quiz cards)
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={aiCoverLoading || !quizId || uploadingImage}
                    onClick={handleGenerateCoverImage}
                    className="gap-1.5"
                  >
                    {aiCoverLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-4 w-4" />
                        Generate with AI
                      </>
                    )}
                  </Button>
                </div>

                {formData.descriptionImageUrl ? (
                  <div className="space-y-3">
                    <div className="relative rounded-lg border overflow-hidden bg-muted h-48">
                      <Image
                        src={formData.descriptionImageUrl}
                        alt="Quiz cover"
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl" className="text-xs">Or update URL directly:</Label>
                      <Input
                        id="imageUrl"
                        value={formData.descriptionImageUrl}
                        onChange={(e) => updateField("descriptionImageUrl", e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label htmlFor="file-upload" className="cursor-pointer">
                          <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors">
                            {uploadingImage ? (
                              <div className="flex flex-col items-center gap-2">
                                <LoadingSpinner size="sm" />
                                <span className="text-sm text-muted-foreground">Uploading...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <UploadIcon className="h-8 w-8 text-muted-foreground" />
                                <span className="text-sm font-medium">Click to upload</span>
                                <span className="text-xs text-muted-foreground">PNG, JPG, GIF, WebP (max 5MB)</span>
                              </div>
                            )}
                          </div>
                          <input
                            id="file-upload"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                          />
                        </Label>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageUrlInput">Enter Image URL</Label>
                      <Input
                        id="imageUrlInput"
                        value={formData.descriptionImageUrl}
                        onChange={(e) => updateField("descriptionImageUrl", e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Label className="text-base">Attempt limits</Label>
                    <p className="text-sm text-muted-foreground">
                      Control how many times each user can attempt this quiz.
                    </p>
                  </div>
                  <Switch
                    id="attempt-limit-toggle"
                    checked={attemptLimitEnabled}
                    onCheckedChange={handleAttemptLimitToggle}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={attemptLimitEnabled ? "secondary" : "outline"}>{attemptLimitSummary}</Badge>
                  {attemptLimitEnabled && (
                    <Badge variant="outline">
                      {attemptResetPeriodValue === AttemptResetPeriod.NEVER
                        ? "No automatic reset"
                        : `Resets ${attemptResetLabel.toLowerCase()}`}
                    </Badge>
                  )}
                  {attemptLimitEnabled && formData.recurringType !== "NONE" && (
                    <Badge variant="outline">
                      Quiz recurs {formData.recurringType.toLowerCase()}
                    </Badge>
                  )}
                </div>

                {attemptLimitEnabled ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="maxAttemptsPerUser">Attempts Allowed</Label>
                      <Input
                        id="maxAttemptsPerUser"
                        type="number"
                        min={1}
                        value={formData.maxAttemptsPerUser}
                        onChange={(e) => updateField("maxAttemptsPerUser", e.target.value)}
                        placeholder="e.g. 3"
                      />
                      <p className="text-xs text-muted-foreground">
                        Users can start up to this many attempts before the lock applies.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="attemptResetPeriod">Reset Schedule</Label>
                      <Select
                        value={formData.attemptResetPeriod}
                        onValueChange={(value) => {
                          updateField("attemptResetPeriod", value);
                          updateField("recurringType", value === "NEVER" ? "NONE" : value);
                        }}
                      >
                        <SelectTrigger id="attemptResetPeriod">
                          <SelectValue placeholder="Select reset cadence" />
                        </SelectTrigger>
                        <SelectContent>
                          {attemptResetOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{attemptResetHelpText}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                    Users currently have unlimited attempts for this quiz.
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="sport">Sport</Label>
                  <Select
                    value={formData.sport || undefined}
                    onValueChange={(value) => updateField("sport", value)}
                    disabled={loadingSports}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingSports ? "Loading..." : "Select sport (root topic)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const list = sports;
                        const cur = formData.sport?.trim();
                        const exists = cur && list.some((t) => t.name.toLowerCase() === cur.toLowerCase());
                        const merged = !cur || exists ? list : [{ id: "current", name: cur }, ...list];
                        return merged;
                      })().map((t) => (
                        <SelectItem key={t.id} value={t.name}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty *</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => updateField("difficulty", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => updateField("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="REVIEW">Review</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quiz Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Configuration</CardTitle>
              <CardDescription>Time limits and passing criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    Total Duration (seconds)
                    {formData.timePerQuestion && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (auto-calculated)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => updateField("duration", e.target.value)}
                    disabled={Boolean(formData.timePerQuestion)}
                    className={formData.timePerQuestion ? "bg-muted" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.timePerQuestion
                      ? "Auto-calculated from time per question"
                      : "Total time for entire quiz"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timePerQuestion">Time per Question (seconds)</Label>
                  <Input
                    id="timePerQuestion"
                    type="number"
                    value={formData.timePerQuestion}
                    onChange={(e) => updateField("timePerQuestion", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Overrides total duration if set
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passingScore">Passing Score (%) *</Label>
                  <Input
                    id="passingScore"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passingScore}
                    onChange={(e) => updateField("passingScore", e.target.value)}
                    required
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="questionSelectionMode">Question Selection Mode *</Label>
                <Select value={formData.questionSelectionMode} onValueChange={(value) => updateField("questionSelectionMode", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixed - Predefined questions in order</SelectItem>
                    <SelectItem value="TOPIC_RANDOM">Topic Random - Random from topics</SelectItem>
                    <SelectItem value="POOL_RANDOM">Pool Random - Random from quiz pool</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.questionSelectionMode === "TOPIC_RANDOM" && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Configure Topics</h4>
                      <p className="text-sm text-muted-foreground">
                        Select which topics to randomly pull questions from, and how many from each
                      </p>
                    </div>
                    <Link href={`/admin/quizzes/${quizId}/topics`}>
                      <Button variant="outline" size="sm">
                        Configure Topics
                      </Button>
                    </Link>
                  </div>

                  {topicConfigs.length > 0 ? (
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                      <div className="text-xs font-medium mb-2">
                        Configured Topics ({topicConfigs.length}):
                      </div>
                      <div className="space-y-1">
                        {topicConfigs.map((config: any) => (
                          <div key={config.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span>{config.topic.name}</span>
                              <Badge variant={
                                config.difficulty === "EASY" ? "secondary" :
                                  config.difficulty === "HARD" ? "destructive" :
                                    "default"
                              } className="text-xs">
                                {config.difficulty}
                              </Badge>
                            </div>
                            <span className="text-muted-foreground text-xs">
                              {config.questionCount} questions
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800 text-xs text-muted-foreground">
                        Total: {topicConfigs.reduce((sum: number, config: any) => sum + config.questionCount, 0)} questions per quiz
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-muted-foreground italic">
                        No topics configured yet. Click &quot;Configure Topics&quot; to add topics.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {formData.questionSelectionMode === "POOL_RANDOM" && (
                <div className="space-y-2">
                  <Label htmlFor="questionCount">Number of Questions *</Label>
                  <Input
                    id="questionCount"
                    type="number"
                    min="1"
                    value={formData.questionCount}
                    onChange={(e) => updateField("questionCount", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    How many random questions to select from the quiz pool
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Randomize Question Order</Label>
                  <p className="text-sm text-muted-foreground">Shuffle questions for each attempt</p>
                </div>
                <Switch
                  checked={formData.randomizeQuestionOrder}
                  onCheckedChange={(checked) => updateField("randomizeQuestionOrder", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Hints</Label>
                  <p className="text-sm text-muted-foreground">Allow users to see question hints</p>
                </div>
                <Switch
                  checked={formData.showHints}
                  onCheckedChange={(checked) => updateField("showHints", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Scoring */}
          <Card>
            <CardHeader>
              <CardTitle>Scoring Rules</CardTitle>
              <CardDescription>Configure how points are awarded</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="completionBonus">Completion Bonus</Label>
                <Input
                  id="completionBonus"
                  type="number"
                  min="0"
                  value={formData.completionBonus}
                  onChange={(e) => updateField("completionBonus", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">One-time bonus on first pass; also sets zero-time cap.</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Negative Marking</Label>
                  <p className="text-sm text-muted-foreground">Deduct points for wrong answers</p>
                </div>
                <Switch
                  checked={formData.negativeMarkingEnabled}
                  onCheckedChange={(checked) => updateField("negativeMarkingEnabled", checked)}
                />
              </div>

              {formData.negativeMarkingEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="penaltyPercentage">Penalty Percentage</Label>
                  <Input
                    id="penaltyPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.penaltyPercentage}
                    onChange={(e) => updateField("penaltyPercentage", e.target.value)}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Time Bonus</Label>
                  <p className="text-sm text-muted-foreground">Award bonus points for speed</p>
                </div>
                <Switch
                  checked={formData.timeBonusEnabled}
                  onCheckedChange={(checked) => updateField("timeBonusEnabled", checked)}
                />
              </div>

              {formData.timeBonusEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="bonusPointsPerSecond">Bonus Points per Second</Label>
                  <Input
                    id="bonusPointsPerSecond"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.bonusPointsPerSecond}
                    onChange={(e) => updateField("bonusPointsPerSecond", e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle>Scheduling</CardTitle>
              <CardDescription>Control when quiz is available</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => updateField("startTime", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => updateField("endTime", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="answersRevealTime">Answers Reveal Time</Label>
                  <Input
                    id="answersRevealTime"
                    type="datetime-local"
                    value={formData.answersRevealTime}
                    onChange={(e) => updateField("answersRevealTime", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurringType">Recurring Type</Label>
                <Select value={formData.recurringType} onValueChange={(value) => updateField("recurringType", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    <SelectItem value="HOURLY">Hourly</SelectItem>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle>SEO Settings</CardTitle>
                <CardDescription>Optimize for search engines</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRegenerateSEO}
                disabled={seoRegenerating || !quizId}
              >
                {seoRegenerating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                    Regenerate with AI
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => updateField("seoTitle", e.target.value)}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">{formData.seoTitle.length}/60 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => updateField("seoDescription", e.target.value)}
                  maxLength={160}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">{formData.seoDescription.length}/160 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoKeywords">SEO Keywords</Label>
                <Input
                  id="seoKeywords"
                  value={formData.seoKeywords}
                  onChange={(e) => updateField("seoKeywords", e.target.value)}
                  placeholder="nba, basketball, champions, quiz"
                />
                <p className="text-xs text-muted-foreground">Comma-separated keywords</p>
              </div>
            </CardContent>
          </Card>

          {/* Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
              <CardDescription>Control quiz visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Featured Quiz</Label>
                  <p className="text-sm text-muted-foreground">Show on homepage and featured sections</p>
                </div>
                <Switch
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => updateField("isFeatured", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions moved to sticky bar */}
        </form>

      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{formData.title}&quot;? This will archive the quiz and it will no longer be visible to users.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
