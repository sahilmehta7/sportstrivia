"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
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

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    sport: "",
    difficulty: "MEDIUM",
    status: "DRAFT",
    duration: "",
    timePerQuestion: "",
    passingScore: "70",
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
    isFeatured: false,
    isPublished: false,
    seoTitle: "",
    seoDescription: "",
    seoKeywords: "",
  });

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
          sport: quiz.sport || "",
          difficulty: quiz.difficulty || "MEDIUM",
          status: quiz.status || "DRAFT",
          duration: quiz.duration?.toString() || "",
          timePerQuestion: quiz.timePerQuestion?.toString() || "",
          passingScore: quiz.passingScore?.toString() || "70",
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
          isFeatured: quiz.isFeatured || false,
          isPublished: quiz.isPublished || false,
          seoTitle: quiz.seoTitle || "",
          seoDescription: quiz.seoDescription || "",
          seoKeywords: quiz.seoKeywords?.join(", ") || "",
        });
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Prepare data
      const data = {
        ...formData,
        duration: formData.duration ? parseInt(formData.duration) : null,
        timePerQuestion: formData.timePerQuestion ? parseInt(formData.timePerQuestion) : null,
        passingScore: parseInt(formData.passingScore),
        questionCount: formData.questionCount ? parseInt(formData.questionCount) : null,
        penaltyPercentage: parseInt(formData.penaltyPercentage),
        bonusPointsPerSecond: parseFloat(formData.bonusPointsPerSecond),
        seoKeywords: formData.seoKeywords ? formData.seoKeywords.split(",").map(k => k.trim()) : [],
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        answersRevealTime: formData.answersRevealTime || undefined,
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

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Edit Quiz: ${formData.title}`}
        description="Update quiz details and configuration"
        action={
          <div className="flex gap-2">
            <Link href={`/admin/quizzes/${quizId}/questions`}>
              <Button variant="secondary">
                Manage Questions
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Link href="/admin/quizzes">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential quiz details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
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

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="sport">Sport</Label>
                <Input
                  id="sport"
                  value={formData.sport}
                  onChange={(e) => updateField("sport", e.target.value)}
                />
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
                <Label htmlFor="duration">Duration (seconds)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => updateField("duration", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timePerQuestion">Time per Question (seconds)</Label>
                <Input
                  id="timePerQuestion"
                  type="number"
                  value={formData.timePerQuestion}
                  onChange={(e) => updateField("timePerQuestion", e.target.value)}
                />
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

            {formData.questionSelectionMode !== "FIXED" && (
              <div className="space-y-2">
                <Label htmlFor="questionCount">Number of Questions *</Label>
                <Input
                  id="questionCount"
                  type="number"
                  min="1"
                  value={formData.questionCount}
                  onChange={(e) => updateField("questionCount", e.target.value)}
                />
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
          <CardHeader>
            <CardTitle>SEO Settings</CardTitle>
            <CardDescription>Optimize for search engines</CardDescription>
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

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Published</Label>
                <p className="text-sm text-muted-foreground">Make quiz visible to users</p>
              </div>
              <Switch
                checked={formData.isPublished}
                onCheckedChange={(checked) => updateField("isPublished", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/quizzes">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Quiz</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{formData.title}"? This will archive the quiz and it will no longer be visible to users.
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
