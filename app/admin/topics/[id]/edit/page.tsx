"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, Wand2, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditTopicPageProps {
  params: Promise<{ id: string }>;
}

export default function EditTopicPage({ params }: EditTopicPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [topicId, setTopicId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);
  const [currentTopic, setCurrentTopic] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // AI generation state
  const [easyCount, setEasyCount] = useState(3);
  const [mediumCount, setMediumCount] = useState(3);
  const [hardCount, setHardCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[] | null>(null);
  const [lastTaskId, setLastTaskId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
    displayEmoji: "",
    displayImageUrl: "",
  });

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params;
      setTopicId(resolvedParams.id);

      try {
        // Load all topics and current topic in parallel
        const [topicsResponse, topicResponse] = await Promise.all([
          fetch("/api/admin/topics?flat=true"),
          fetch(`/api/admin/topics/${resolvedParams.id}`),
        ]);

        const [topicsResult, topicResult] = await Promise.all([
          topicsResponse.json(),
          topicResponse.json(),
        ]);

        if (!topicsResponse.ok || !topicResponse.ok) {
          throw new Error("Failed to load data");
        }

        // Filter out current topic and its descendants from parent options
        const availableParents = topicsResult.data.topics.filter(
          (t: any) => t.id !== resolvedParams.id
        );
        setTopics(availableParents);

        const topic = topicResult.data;
        setCurrentTopic(topic);

        setFormData({
          name: topic.name || "",
          slug: topic.slug || "",
          description: topic.description || "",
          parentId: topic.parentId || "",
          displayEmoji: topic.displayEmoji || "",
          displayImageUrl: topic.displayImageUrl || "",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        router.push("/admin/topics");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params, router, toast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        parentId: formData.parentId || null,
        displayEmoji: formData.displayEmoji || null,
        displayImageUrl: formData.displayImageUrl || null,
      };

      const response = await fetch(`/api/admin/topics/${topicId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update topic");
      }

      toast({
        title: "Topic updated!",
        description: `${formData.name} has been updated successfully.`,
      });

      router.push("/admin/topics");
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
      const response = await fetch(`/api/admin/topics/${topicId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.data?.message?.includes("successfully")) {
        toast({
          title: "Cannot Delete Topic",
          description: result.data?.message || result.error || "Failed to delete topic",
          variant: "destructive",
        });
        setDeleteDialogOpen(false);
        return;
      }

      toast({
        title: "Topic deleted!",
        description: "The topic has been removed successfully.",
      });

      router.push("/admin/topics");
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
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerateQuestions = async () => {
    if (!topicId) return;
    const total = (easyCount || 0) + (mediumCount || 0) + (hardCount || 0);
    if (total < 1) {
      toast({ title: "Nothing to generate", description: "Set at least one question to generate.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setGeneratedQuestions(null);
    setLastTaskId(null);
    try {
      const fetchPromise = fetch(`/api/admin/topics/${topicId}/ai/generate-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ easyCount, mediumCount, hardCount }),
      });
      toast({
        title: "Question generation started",
        description: "Saved to AI Background Tasks. Feel free to continue editing while we work.",
      });
      const res = await fetchPromise;
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate questions");
      }
      setGeneratedQuestions(data.data.questions || []);
      setLastTaskId(data.data.taskId ?? null);
      toast({
        title: "AI ready",
        description: `Generated ${data.data.questions?.length || 0} questions. Saved to Background Tasks.`,
      });
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleImportQuestions = async () => {
    if (!generatedQuestions || generatedQuestions.length === 0) return;
    setImporting(true);
    let created = 0;
    try {
      for (const q of generatedQuestions) {
        const payload = {
          type: "MULTIPLE_CHOICE",
          topicId,
          difficulty: q.difficulty || "MEDIUM",
          questionText: q.questionText,
          questionImageUrl: "",
          questionVideoUrl: "",
          questionAudioUrl: "",
          hint: q.hint || undefined,
          explanation: q.explanation || undefined,
          explanationImageUrl: "",
          explanationVideoUrl: "",
          randomizeAnswerOrder: false,
          timeLimit: undefined,
          answers: (q.answers || []).map((a: any, idx: number) => ({
            answerText: a.answerText,
            answerImageUrl: "",
            answerVideoUrl: "",
            answerAudioUrl: "",
            isCorrect: !!a.isCorrect,
            displayOrder: idx,
          })),
        };
        const resp = await fetch(`/api/admin/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (resp.ok) {
          created += 1;
        }
      }
      toast({ title: "Questions imported", description: `Created ${created} question(s)` });
      setGeneratedQuestions(null);
      router.refresh();
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const canDelete =
    currentTopic &&
    currentTopic._count.questions === 0 &&
    currentTopic._count.children === 0 &&
    currentTopic._count.quizTopicConfigs === 0;

  return (
    <div>
      <PageHeader
        title={`Edit Topic: ${currentTopic?.name}`}
        description="Update topic details and hierarchy"
        action={
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={!canDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Link href="/admin/topics">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        }
      />

      {!canDelete && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm font-medium">⚠️ This topic cannot be deleted because:</p>
          <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
            {currentTopic._count.questions > 0 && (
              <li>It has {currentTopic._count.questions} question(s)</li>
            )}
            {currentTopic._count.children > 0 && (
              <li>It has {currentTopic._count.children} sub-topic(s)</li>
            )}
            {currentTopic._count.quizTopicConfigs > 0 && (
              <li>It is used in {currentTopic._count.quizTopicConfigs} quiz configuration(s)</li>
            )}
          </ul>
          <p className="text-sm mt-2">
            Remove all dependencies before deleting.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Topic Information</CardTitle>
            <CardDescription>Update topic details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
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
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier (lowercase, hyphens)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayEmoji">Display Emoji</Label>
              <Input
                id="displayEmoji"
                placeholder="e.g., 🏀"
                value={formData.displayEmoji}
                onChange={(e) => updateField("displayEmoji", e.target.value)}
                maxLength={8}
              />
              <p className="text-xs text-muted-foreground">Optional. Single emoji recommended.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayImageUrl">Display Image URL</Label>
              <Input
                id="displayImageUrl"
                placeholder="https://..."
                value={formData.displayImageUrl}
                onChange={(e) => updateField("displayImageUrl", e.target.value)}
                type="url"
              />
              <p className="text-xs text-muted-foreground">Optional. Used when you prefer an image over emoji.</p>
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

            <div className="space-y-2">
              <Label htmlFor="parentId">Parent Topic</Label>
              <Select
                value={formData.parentId || "none"}
                onValueChange={(val) => updateField("parentId", val === "none" ? "" : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="None (root topic)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (root topic)</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {"  ".repeat(topic.level)}
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Changing parent will update this topic&apos;s level and all descendants
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Question Generator</CardTitle>
            <CardDescription>Generate more unique questions for this topic</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="easyCount">Easy</Label>
                <Input
                  id="easyCount"
                  type="number"
                  min={0}
                  max={50}
                  value={easyCount}
                  onChange={(e) => setEasyCount(Math.max(0, Math.min(50, parseInt(e.target.value || "0", 10))))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mediumCount">Medium</Label>
                <Input
                  id="mediumCount"
                  type="number"
                  min={0}
                  max={50}
                  value={mediumCount}
                  onChange={(e) => setMediumCount(Math.max(0, Math.min(50, parseInt(e.target.value || "0", 10))))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hardCount">Hard</Label>
                <Input
                  id="hardCount"
                  type="number"
                  min={0}
                  max={50}
                  value={hardCount}
                  onChange={(e) => setHardCount(Math.max(0, Math.min(50, parseInt(e.target.value || "0", 10))))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Total to generate: {(easyCount || 0) + (mediumCount || 0) + (hardCount || 0)}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleGenerateQuestions}
                  disabled={generating || ((easyCount + mediumCount + hardCount) < 1)}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate with AI
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handleImportQuestions}
                  disabled={importing || !generatedQuestions || generatedQuestions.length === 0}
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import Generated
                    </>
                  )}
                </Button>
              </div>
            </div>

            {lastTaskId && (
              <div className="flex flex-col gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-xs text-primary sm:flex-row sm:items-center sm:justify-between sm:text-sm">
                <span className="font-medium">Saved to Background Tasks</span>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/ai-tasks/${lastTaskId}`}>Open task</Link>
                </Button>
              </div>
            )}

            {generatedQuestions && generatedQuestions.length > 0 && (
              <div className="rounded border p-3 text-sm">
                <div className="font-medium mb-2">Preview ({generatedQuestions.length})</div>
                <div className="space-y-2">
                  {generatedQuestions.slice(0, 3).map((q, idx) => (
                    <div key={idx} className="border rounded p-2">
                      <div className="font-medium">{idx + 1}. {q.questionText}</div>
                      <div className="text-xs text-muted-foreground mt-1">{q.answers?.length || 0} answers • {q.difficulty}</div>
                    </div>
                  ))}
                  {generatedQuestions.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">... and {generatedQuestions.length - 3} more</div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Topic Statistics</CardTitle>
            <CardDescription>Current usage of this topic</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{currentTopic?._count.questions || 0}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{currentTopic?._count.children || 0}</div>
                <div className="text-sm text-muted-foreground">Sub-topics</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {currentTopic?._count.quizTopicConfigs || 0}
                </div>
                <div className="text-sm text-muted-foreground">Quiz Configs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Preview</h4>
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">Name:</span>{" "}
              <span className="font-medium">{formData.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Slug:</span>{" "}
              <code className="bg-background px-1 rounded">{formData.slug}</code>
            </div>
            <div>
              <span className="text-muted-foreground">Current Level:</span>{" "}
              <Badge>{currentTopic?.level}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">New Level:</span>{" "}
              <Badge>
                {formData.parentId
                  ? (topics.find((t) => t.id === formData.parentId)?.level || 0) + 1
                  : 0}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link href="/admin/topics">
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
            <DialogTitle>Delete Topic</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{currentTopic?.name}&quot;?
              {currentTopic && !canDelete && (
                <div className="mt-4 space-y-2 text-destructive font-medium">
                  {currentTopic._count.questions > 0 && (
                    <div>⚠️ Has {currentTopic._count.questions} question(s)</div>
                  )}
                  {currentTopic._count.children > 0 && (
                    <div>⚠️ Has {currentTopic._count.children} sub-topic(s)</div>
                  )}
                  {currentTopic._count.quizTopicConfigs > 0 && (
                    <div>⚠️ Used in {currentTopic._count.quizTopicConfigs} quiz(es)</div>
                  )}
                  <p className="text-sm mt-2">
                    Remove all dependencies before deleting.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || !canDelete}
            >
              {deleting ? "Deleting..." : "Delete Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
