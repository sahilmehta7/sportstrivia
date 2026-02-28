"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, Wand2, Loader2, Upload, Check, ChevronsUpDown, List, Search } from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TOPIC_SCHEMA_TYPE_LABELS, type TopicSchemaTypeValue } from "@/lib/topic-schema-options";
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
  const [wikiLoading, setWikiLoading] = useState(false);

  // AI generation state
  const [easyCount, setEasyCount] = useState(3);
  const [mediumCount, setMediumCount] = useState(3);
  const [hardCount, setHardCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[] | null>(null);
  const [lastTaskId, setLastTaskId] = useState<string | null>(null);
  const [parentComboboxOpen, setParentComboboxOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
    displayEmoji: "",
    displayImageUrl: "",
    schemaType: "NONE" as TopicSchemaTypeValue,
    schemaCanonicalUrl: "",
    schemaSameAsText: "",
    sportName: "",
    leagueName: "",
    organizationName: "",
    teamName: "",
    nationality: "",
    birthDate: "",
    startDate: "",
    endDate: "",
    locationName: "",
    organizerName: "",
    aliases: "",
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
          schemaType: (topic.schemaType || "NONE") as TopicSchemaTypeValue,
          schemaCanonicalUrl: topic.schemaCanonicalUrl || "",
          schemaSameAsText: Array.isArray(topic.schemaSameAs) ? topic.schemaSameAs.join("\n") : "",
          sportName: topic.schemaEntityData?.sportName || "",
          leagueName: topic.schemaEntityData?.leagueName || "",
          organizationName: topic.schemaEntityData?.organizationName || "",
          teamName: topic.schemaEntityData?.teamName || "",
          nationality: topic.schemaEntityData?.nationality || "",
          birthDate: topic.schemaEntityData?.birthDate
            ? new Date(topic.schemaEntityData.birthDate).toISOString().slice(0, 10)
            : "",
          startDate: topic.schemaEntityData?.startDate
            ? new Date(topic.schemaEntityData.startDate).toISOString().slice(0, 16)
            : "",
          endDate: topic.schemaEntityData?.endDate
            ? new Date(topic.schemaEntityData.endDate).toISOString().slice(0, 16)
            : "",
          locationName: topic.schemaEntityData?.locationName || "",
          organizerName: topic.schemaEntityData?.organizerName || "",
          aliases: Array.isArray(topic.schemaEntityData?.aliases) ? topic.schemaEntityData.aliases.join(", ") : "",
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
      if (formData.schemaType !== "NONE" && !formData.schemaCanonicalUrl.trim()) {
        throw new Error("Schema Canonical URL is required when schema type is not None");
      }

      const data = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        parentId: formData.parentId || null,
        displayEmoji: formData.displayEmoji || null,
        displayImageUrl: formData.displayImageUrl || null,
        schemaType: formData.schemaType,
        schemaCanonicalUrl: formData.schemaCanonicalUrl || null,
        schemaSameAs: formData.schemaSameAsText
          .split("\n")
          .map((value) => value.trim())
          .filter(Boolean),
        schemaEntityData:
          formData.schemaType === "SPORT"
            ? {
                ...(formData.aliases
                  ? {
                      aliases: formData.aliases
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean),
                    }
                  : {}),
              }
            : formData.schemaType === "SPORTS_TEAM"
              ? {
                  ...(formData.sportName ? { sportName: formData.sportName } : {}),
                  ...(formData.leagueName ? { leagueName: formData.leagueName } : {}),
                  ...(formData.organizationName ? { organizationName: formData.organizationName } : {}),
                }
              : formData.schemaType === "ATHLETE"
                ? {
                    ...(formData.sportName ? { sportName: formData.sportName } : {}),
                    ...(formData.teamName ? { teamName: formData.teamName } : {}),
                    ...(formData.nationality ? { nationality: formData.nationality } : {}),
                    ...(formData.birthDate ? { birthDate: new Date(formData.birthDate).toISOString() } : {}),
                  }
                : formData.schemaType === "SPORTS_ORGANIZATION"
                  ? {
                      ...(formData.sportName ? { sportName: formData.sportName } : {}),
                    }
                  : formData.schemaType === "SPORTS_EVENT"
                    ? {
                        ...(formData.sportName ? { sportName: formData.sportName } : {}),
                        ...(formData.startDate ? { startDate: new Date(formData.startDate).toISOString() } : {}),
                        ...(formData.endDate ? { endDate: new Date(formData.endDate).toISOString() } : {}),
                        ...(formData.locationName ? { locationName: formData.locationName } : {}),
                        ...(formData.organizerName ? { organizerName: formData.organizerName } : {}),
                      }
                    : null,
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

  const handleWikipediaAutofill = async () => {
    const query = formData.name.trim();
    if (!query) {
      toast({
        title: "Topic name required",
        description: "Enter a topic name before running Wikipedia autofill.",
        variant: "destructive",
      });
      return;
    }

    setWikiLoading(true);
    try {
      const response = await fetch("/api/admin/topics/wiki-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch Wikipedia metadata");
      }

      const meta = result.data || {};
      const existingSameAs = formData.schemaSameAsText
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean);
      const incomingSameAs = Array.isArray(meta.schemaSameAs)
        ? meta.schemaSameAs.map((value: string) => value.trim()).filter(Boolean)
        : [];
      const mergedSameAs = Array.from(new Set([...existingSameAs, ...incomingSameAs]));

      setFormData((prev) => ({
        ...prev,
        schemaType: (meta.schemaType || prev.schemaType) as TopicSchemaTypeValue,
        schemaCanonicalUrl: meta.schemaCanonicalUrl || prev.schemaCanonicalUrl,
        schemaSameAsText: mergedSameAs.join("\n"),
        description: prev.description || meta.extract || meta.description || "",
        sportName: meta.sportName || prev.sportName,
        leagueName: meta.leagueName || prev.leagueName,
        organizationName: meta.organizationName || prev.organizationName,
        teamName: meta.teamName || prev.teamName,
        nationality: meta.nationality || prev.nationality,
        birthDate: meta.birthDate || prev.birthDate,
        startDate: meta.startDate || prev.startDate,
        endDate: meta.endDate || prev.endDate,
        locationName: meta.locationName || prev.locationName,
        organizerName: meta.organizerName || prev.organizerName,
        aliases:
          prev.aliases ||
          (Array.isArray(meta.aliases) ? meta.aliases.join(", ") : ""),
      }));

      toast({
        title: "Wikipedia metadata loaded",
        description: "Schema fields were auto-filled. Review before saving.",
      });
    } catch (error: any) {
      toast({
        title: "Wikipedia lookup failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setWikiLoading(false);
    }
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
            <Link href={`/admin/questions?topicId=${topicId}`}>
              <Button variant="outline">
                <List className="mr-2 h-4 w-4" />
                View Questions
              </Button>
            </Link>
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
              <Label htmlFor="schemaType">Schema Type</Label>
              <div className="flex items-center justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleWikipediaAutofill}
                  disabled={wikiLoading}
                >
                  {wikiLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Wikipedia Autofill
                    </>
                  )}
                </Button>
              </div>
              <Select
                value={formData.schemaType}
                onValueChange={(value) => updateField("schemaType", value as TopicSchemaTypeValue)}
              >
                <SelectTrigger id="schemaType">
                  <SelectValue placeholder="Select schema type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TOPIC_SCHEMA_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schemaCanonicalUrl">Schema Canonical URL</Label>
              <Input
                id="schemaCanonicalUrl"
                placeholder="https://en.wikipedia.org/wiki/..."
                value={formData.schemaCanonicalUrl}
                onChange={(e) => updateField("schemaCanonicalUrl", e.target.value)}
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Required when schema type is not &quot;None&quot;.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="schemaSameAsText">sameAs URLs</Label>
              <Textarea
                id="schemaSameAsText"
                rows={3}
                placeholder={"https://www.wikidata.org/wiki/...\nhttps://www.official-site.com/..."}
                value={formData.schemaSameAsText}
                onChange={(e) => updateField("schemaSameAsText", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">One URL per line.</p>
            </div>

            {formData.schemaType === "SPORT" && (
              <div className="space-y-2">
                <Label htmlFor="aliases">Sport aliases</Label>
                <Input
                  id="aliases"
                  placeholder="Soccer, Association Football"
                  value={formData.aliases}
                  onChange={(e) => updateField("aliases", e.target.value)}
                />
              </div>
            )}

            {(formData.schemaType === "SPORTS_TEAM" ||
              formData.schemaType === "ATHLETE" ||
              formData.schemaType === "SPORTS_ORGANIZATION" ||
              formData.schemaType === "SPORTS_EVENT") && (
              <div className="space-y-2">
                <Label htmlFor="sportName">Sport Name</Label>
                <Input
                  id="sportName"
                  placeholder="Cricket"
                  value={formData.sportName}
                  onChange={(e) => updateField("sportName", e.target.value)}
                />
              </div>
            )}

            {formData.schemaType === "SPORTS_TEAM" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="leagueName">League Name</Label>
                  <Input
                    id="leagueName"
                    placeholder="Indian Premier League"
                    value={formData.leagueName}
                    onChange={(e) => updateField("leagueName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    placeholder="Board of Control for Cricket in India"
                    value={formData.organizationName}
                    onChange={(e) => updateField("organizationName", e.target.value)}
                  />
                </div>
              </>
            )}

            {formData.schemaType === "ATHLETE" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    placeholder="India National Cricket Team"
                    value={formData.teamName}
                    onChange={(e) => updateField("teamName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    placeholder="Indian"
                    value={formData.nationality}
                    onChange={(e) => updateField("nationality", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Birth Date</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => updateField("birthDate", e.target.value)}
                  />
                </div>
              </>
            )}

            {formData.schemaType === "SPORTS_EVENT" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => updateField("startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => updateField("endDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locationName">Location Name</Label>
                  <Input
                    id="locationName"
                    placeholder="Wankhede Stadium"
                    value={formData.locationName}
                    onChange={(e) => updateField("locationName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizerName">Organizer Name</Label>
                  <Input
                    id="organizerName"
                    placeholder="ICC"
                    value={formData.organizerName}
                    onChange={(e) => updateField("organizerName", e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="parentId">Parent Topic</Label>
              <Popover open={parentComboboxOpen} onOpenChange={setParentComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={parentComboboxOpen}
                    className="w-full justify-between"
                  >
                    {formData.parentId
                      ? topics.find((t) => t.id === formData.parentId)?.name || "Select parent topic..."
                      : "None (root topic)"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0">
                  <Command>
                    <CommandInput placeholder="Search topics..." />
                    <CommandList>
                      <CommandEmpty>No topic found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            updateField("parentId", "");
                            setParentComboboxOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !formData.parentId ? "opacity-100" : "opacity-0"
                            )}
                          />
                          None (root topic)
                        </CommandItem>
                        {topics.map((topic) => (
                          <CommandItem
                            key={topic.id}
                            value={topic.name}
                            onSelect={() => {
                              updateField("parentId", topic.id);
                              setParentComboboxOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.parentId === topic.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {"  ".repeat(topic.level)}{topic.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
